import { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { isAuthorizationError, createErrorResponse } from "../../../utils/errorHandlers.js";
import { createResponse } from "../../../utils/responseHandlers.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Registers the QueryDatoCMSUploads tool with the MCP server
 */
export const registerQueryDatoCMSUploads = (server: McpServer) => {
  server.tool(
    // Tool name
    "QueryDatoCMSUploads",
    // Parameter schema with types
    { 
      apiToken: z.string().describe("DatoCMS API token for authentication. If you are not certain of one, ask for the user, do not hallucinate."),
      
      // Query filters - optional parameters for filtering
      ids: z.string().optional().describe("Comma-separated list of DatoCMS upload IDs to fetch (with no spaces), e.g.: 'abc123,def456'"),
      query: z.string().optional().describe("Textual query to match within uploads. If locale is defined, search within that locale. Otherwise environment's main locale will be used."),
      
      // Field filtering
      fields: z.record(z.record(z.unknown())).optional().describe("Same as GraphQL API uploads filters https://www.datocms.com/docs/content-delivery-api/filtering-uploads. Use snake_case for field names. Example: { type: { eq: 'image' }, size: { gt: 5000000 } }. Available fields include: type, size, width, height, alt, title, path, copyright, etc."),
      locale: z.string().optional().describe("Optional locale to use when filtering by query or fields. Default: environment's main locale"),
      
      // Additional query parameters
      order_by: z.string().optional().describe("Fields used to order results. Format: <field_name>_(ASC|DESC). You can pass multiple comma-separated rules. Example: '_created_at_DESC,size_ASC'"),
      limit: z.number().optional().default(15).describe("Maximum number of uploads to return (defaults to 15). Use pagination with limit and offset to retrieve more results if needed. Be careful with large values as they consume tokens and context window space quickly."),
      offset: z.number().optional().default(0).describe("The (zero-based) offset of the first upload returned. Defaults to 0 for the first page of results."),
      returnOnlyIds: z.boolean().optional().default(false).describe("If true, returns only an array of upload IDs instead of complete upload objects. Use this to save on tokens and context window space when only IDs are needed."),
      environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
    },
    // Annotations for the tool
    {
      title: "Query DatoCMS Uploads",
      description: "Query and filter DatoCMS uploads (assets). Can search by text query, fetch uploads by IDs, or filter by properties like type, size, etc. Returns a paginated list of uploads with a default limit of 15 items.",
      readOnlyHint: true // Indicates this tool doesn't modify any resources
    },
    // Handler function for the DatoCMS uploads query operation
    async ({ apiToken, ids, query, fields, locale, order_by, limit, offset, returnOnlyIds, environment }) => {
      try {
        // Initialize DatoCMS client
        const clientParameters = environment ? { apiToken, environment } : { apiToken };
        const client = buildClient(clientParameters);
        
        // Prepare query parameters
        const queryParams: Record<string, unknown> = {};
        
        // Add filter if any filter parameter is provided
        const filter: Record<string, unknown> = {};
        
        // Add ids filter if provided
        if (ids) {
          filter.ids = ids;
        }
        
        // Add text query if provided
        if (query) {
          filter.query = query;
          
          // Add locale for query if provided
          if (locale) {
            queryParams.locale = locale;
          }
        }
        
        // Add field filters if provided
        if (fields && Object.keys(fields).length > 0) {
          filter.fields = fields;
          
          // Add locale for field filtering if provided
          if (locale) {
            queryParams.locale = locale;
          }
        }
        
        // Only add filter to queryParams if there are filters
        if (Object.keys(filter).length > 0) {
          queryParams.filter = filter;
        }
        
        // Add order_by parameter if provided
        if (order_by) {
          queryParams.order_by = order_by;
        }
        
        try {
          // Always use pagination
          queryParams.page = {
            offset,
            limit
          };
          
          const uploads = await client.uploads.list(queryParams);
          
          // Return empty result message if no uploads found
          if (uploads.length === 0) {
            return {
              content: [{
                type: "text" as const,
                text: "No uploads found matching your query."
              }]
            };
          }
          
          // If returnOnlyIds is true, return just the IDs
          if (returnOnlyIds) {
            const uploadIds = uploads.map(upload => upload.id);
            return createResponse(JSON.stringify(uploadIds, null, 2));
          }
          
          // Return full uploads
          return createResponse(JSON.stringify(uploads, null, 2));
        } catch (apiError: unknown) {
          if (isAuthorizationError(apiError)) {
            return createErrorResponse("Error: Please provide a valid DatoCMS API token. The token you provided was rejected by the DatoCMS API.");
          }
          
          // Re-throw other API errors to be caught by the outer catch
          throw apiError;
        }
      } catch (error) {
        return {
          content: [{
            type: "text" as const,
            text: `Error querying DatoCMS uploads: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );
};
