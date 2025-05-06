import { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { isAuthorizationError, isNotFoundError, createErrorResponse } from "../../../utils/errorHandlers.js";
import { createResponse } from "../../../utils/responseHandlers.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Registers the GetDatoCMSUploadReferences tool with the MCP server
 */
export const registerGetDatoCMSUploadReferences = (server: McpServer) => {
  server.tool(
    // Tool name
    "GetDatoCMSUploadReferences",
    // Parameter schema with types
    { 
      apiToken: z.string().describe("DatoCMS API token for authentication. If you are not certain of one, ask for the user, do not halucinate."),
      uploadId: z.string().describe("The ID of the DatoCMS upload to find references for."),
      nested: z.boolean().default(true).optional().describe("For Modular Content, Structured Text and Single Block fields, return full payload for nested blocks instead of just IDs."),
      version: z.enum(["current", "published", "published-or-current"]).default("current").optional().describe("Retrieve only the selected type of version that is linked to the upload: 'current', 'published'"),
      returnOnlyIds: z.boolean().default(false).optional().describe("If true, returns only an array of record IDs instead of complete records. Use this to save on tokens and context window space when only IDs are needed."),
      environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
    },
    // Annotations for the tool
    {
      title: "Get Records Referencing a DatoCMS Upload",
      description: "Retrieves all records that are linked to a specific DatoCMS upload/asset.",
      readOnlyHint: true // This tool doesn't modify any resources
    },
    // Handler function for retrieving references to an upload
    async ({ apiToken, uploadId, nested, version, returnOnlyIds, environment}) => {
      try {
        // Initialize DatoCMS client
        const clientParameters = environment ? { apiToken, environment } : { apiToken };
        const client = buildClient(clientParameters);
        
        try {
          // Build query parameters
          const queryParams: { 
            nested?: boolean; 
            version?: "current" | "published" | "published-or-current" 
          } = {};
          
          // Add optional parameters only if they're provided
          if (nested !== undefined) {
            queryParams.nested = nested;
          }
          
          if (version !== undefined) {
            queryParams.version = version;
          }
          
          // Retrieve references to the upload
          const references = await client.uploads.references(uploadId, queryParams);
          
          // If no references found, return appropriate message
          if (!references || references.length === 0) {
            return createResponse("No records were found that reference this upload.");
          }

          // If returnOnlyIds is true, extract and return just the IDs
          if (returnOnlyIds) {
            const referenceIds = references.map(record => record.id);
            return createResponse(JSON.stringify(referenceIds, null, 2));
          }

          // Otherwise return the full references
          return createResponse(JSON.stringify(references, null, 2));
          
        } catch (apiError: unknown) {
          if (isAuthorizationError(apiError)) {
            return createErrorResponse("Error: Please provide a valid DatoCMS API token. The token you provided was rejected by the DatoCMS API.");
          }
          
          // Check if it's a not found error
          if (isNotFoundError(apiError)) {
            return createErrorResponse(`Error: Upload with ID '${uploadId}' was not found.`);
          }
          
          // Re-throw other API errors to be caught by the outer catch
          throw apiError;
        }
      } catch (error: unknown) {
        return {
          content: [{
            type: "text" as const,
            text: `Error retrieving references to DatoCMS upload: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );
};
