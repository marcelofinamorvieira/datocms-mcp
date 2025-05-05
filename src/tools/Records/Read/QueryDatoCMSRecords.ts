import { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { isAuthorizationError, createErrorResponse } from "../../../utils/errorHandlers.js";
import { createResponse } from "../../../utils/responseHandlers.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { returnMostPopulatedLocale } from "../../../utils/returnMostPopulatedLocale.js";

/**
 * Registers the QueryDatoCMSRecords tool with the MCP server
 */
export const registerQueryDatoCMSRecords = (server: McpServer) => {
  server.tool(
    // Tool name
    "QueryDatoCMSRecords",
    // Parameter schema with types
    { 
      apiToken: z.string().describe("DatoCMS API token for authentication. If you are not certain of one, ask for the user, do not halucinate."),
      
      // Query filters - one of these must be provided
      filterQuery: z.string().optional().describe("The raw string to search for in the DatoCMS items. Do not specify field names, just the value. Try to be as general as possible with the string, as this is not fuzzy search, otherwise you may miss results."),
      ids: z.string().optional().describe("Comma-separated list of DatoCMS record IDs to fetch (with no spaces), e.g.: 'abc123,def456'. Records can be from different models."),
      modelId: z.string().optional().describe("Model ID to restrict results to"),
      modelName: z.string().optional().describe("Model name to restrict results to"),
      
      // Field filtering
      fields: z.record(z.record(z.any())).optional().describe("Filter records by field values within a model. Required to specify modelId or modelName. Object where keys are field API names and values are filter conditions. Example: { name: { in: ['Buddy', 'Rex'] }, breed: { eq: 'mixed' } }. See DatoCMS filtering documentation https://www.datocms.com/docs/content-delivery-api/filtering-records for all available operators: eq, neq, matches, in, nin, gt, gte, lt, lte, exists."),
      locale: z.string().optional().describe("Optional locale to use when filtering by localized fields. If not specified, environment's main locale will be used."),
      
      // Additional query parameters
      order_by: z.string().optional().describe("Fields used to order results. Format: <field_name>_(ASC|DESC), where <field_name> can be a model's field API key or meta columns like id, _updated_at, _created_at, etc. You can pass multiple comma-separated rules (e.g., 'name_DESC,_created_at_ASC'). Requires modelId or modelName to be specified."),
      version: z.enum(["published", "current"]).optional().default("current").describe("Whether to retrieve the published version ('published') or the latest draft ('current'). Default is 'current'."),
      returnAllLocales: z.boolean().optional().default(false).describe("If true, returns all locale versions for each field instead of only the most populated locale. Default is false to save on token usage."),
      returnOnlyIds: z.boolean().optional().default(false).describe("If true, returns only an array of record IDs instead of complete records. Use this to save on tokens and context window space when only IDs are needed. These IDs can then be used with GetDatoCMSRecordById to get detailed information. Default is false."),
      limit: z.number().optional().describe("Optional limit for pagination. If provided along with offset, enables pagination and returns only the specified number of records on that window."),
      offset: z.number().optional().describe("Optional offset for pagination. Only effective when used with limit parameter. This is the number of records to skip before starting to return records."),
      nested: z.boolean().optional().default(true).describe("For Modular Content, Structured Text and Single Block fields. If set to true, returns full payload for nested blocks instead of just their IDs. Default is false.")
    },
    // Annotations for the tool
    {
      title: "Query DatoCMS Records",
      description: "Universal query tool for DatoCMS records. Can search by text query, fetch records by IDs, or get all records from a model. Supports pagination and locale handling.",
      readOnlyHint: true // Indicates this tool doesn't modify any resources
    },
    // Handler function for the DatoCMS query operation
    async ({ apiToken, filterQuery, ids, modelId, modelName, version, returnAllLocales, returnOnlyIds, limit, offset, nested, order_by, fields, locale }) => {
      try {
        // Initialize DatoCMS client
        const client = buildClient({ apiToken });
        
        // Prepare query parameters
        const queryParams: Record<string, unknown> = {
          version,
          nested
        };
        
        // Add order_by parameter if provided with a model type filter
        if (order_by && (modelId || modelName)) {
          queryParams.order_by = order_by;
        }
        
        // Handle filter logic based on provided parameters
        if (filterQuery) {
          // Text search query
          queryParams.filter = { query: filterQuery } as Record<string, unknown>;
          if (modelName) {
            (queryParams.filter as Record<string, unknown>).type = modelName;
          }
        } else if (ids) {
          // IDs-based query
          queryParams.filter = { ids } as Record<string, unknown>;
        } else if (modelId || modelName) {
          // Model-based query with or without field filtering
          queryParams.filter = { 
            type: modelId || modelName 
          } as Record<string, unknown>;
          
          // Add field filtering if provided
          if (fields && Object.keys(fields).length > 0) {
            (queryParams.filter as Record<string, unknown>).fields = fields;
            
            // Add locale for field filtering if provided
            if (locale) {
              queryParams.locale = locale;
            }
          }
        } else if (fields) {
          return createErrorResponse("Error: When using 'fields' filtering, you must also specify either 'modelId' or 'modelName'.");
        } else {
          // No valid query parameter provided
          return createErrorResponse("Error: You must provide at least one of: filterQuery, ids, or modelId/modelName parameter.");
        }
        
        // Add pagination if both limit and offset are provided
        const isPaginated = typeof limit === 'number' && typeof offset === 'number';
        if (isPaginated) {
          queryParams.page = {
            limit,
            offset
          };
        }
        
        // Execute the query
        try {
          // For paginated requests, use client.items.list
          if (isPaginated) {
            const paginatedItems = await client.items.list(queryParams);

            // Return empty result message if no items found
            if (paginatedItems.length === 0) {
              return {
                content: [{
                  type: "text" as const,
                  text: "No items found matching your query."
                }]
              };
            }
            
            // Use map approach for collecting IDs
            if (returnOnlyIds) {
              const allItemIds = paginatedItems.map(item => item.id);
              return createResponse(JSON.stringify(allItemIds, null, 2));
            }
            
            // Process items to filter locales
            const allItems = paginatedItems.map(item => 
              returnMostPopulatedLocale(item, returnAllLocales)
            );
            
            // Return processed items
            return createResponse(JSON.stringify(allItems, null, 2));
          }
          
          // For non-paginated requests, use the iterator to get all pages
          const allItems = [];
          const allItemIds = [];
          
          // Collect items or just IDs from the iterator
          for await (const item of client.items.listPagedIterator(queryParams)) {
            // Store the ID for returnOnlyIds mode
            allItemIds.push(item.id);
            
            // Process each item to filter locales unless returnOnlyIds is true
            if (!returnOnlyIds) {
              allItems.push(returnMostPopulatedLocale(item, returnAllLocales));
            }
          }
          
          // Return empty result message if no items found
          if ((returnOnlyIds ? allItemIds.length : allItems.length) === 0) {
            return {
              content: [{
                type: "text" as const,
                text: "No items found matching your query."
              }]
            };
          }

          // Return only IDs if specified, otherwise return full items
          if (returnOnlyIds) {
            return createResponse(JSON.stringify(allItemIds, null, 2));
          }
          
          // Return full items
          return createResponse(JSON.stringify(allItems, null, 2));
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
            text: `Error querying DatoCMS: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );
};
