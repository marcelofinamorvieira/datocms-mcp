import { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { isAuthorizationError, isNotFoundError, createErrorResponse } from "../utils/errorHandlers.js";
import { createResponse } from "../utils/responseHandlers.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { returnMostPopulatedLocale } from "../utils/returnMostPopulatedLocale.js";

/**
 * Registers the GetDatoCMSRecordReferences tool with the MCP server
 */
export const registerGetDatoCMSRecordReferences = (server: McpServer) => {
  server.tool(
    // Tool name
    "GetDatoCMSRecordReferences",
    // Parameter schema with types
    { 
      apiToken: z.string().describe("DatoCMS API token for authentication. If you are not certain of one, ask for the user, do not halucinate."),
      itemId: z.string().describe("The ID of the DatoCMS record for which to find referencing (linking) records that point to it.")
    },
    // Annotations for the tool
    {
      title: "Get Records Linking to a DatoCMS Record",
      description: "Retrieves all DatoCMS records that link to a specific record by its ID.",
      readOnlyHint: true // Indicates this tool doesn't modify any resources
    },
    // Handler function for retrieving referencing records
    async ({ apiToken, itemId }) => {
      try {
        // Initialize DatoCMS client
        const client = buildClient({ apiToken });
        
        try {
          // Retrieve records that reference the specified item
          const referencingItems = await client.items.references(itemId);
          
          // Convert to JSON and create response (will be chunked only if necessary)
          return createResponse(JSON.stringify(returnMostPopulatedLocale(referencingItems), null, 2));
          
        } catch (apiError: unknown) {
          if (isAuthorizationError(apiError)) {
            return createErrorResponse("Error: Please provide a valid DatoCMS API token. The token you provided was rejected by the DatoCMS API.");
          }
          
          // Check if it's a not found error
          if (isNotFoundError(apiError)) {
            return createErrorResponse(`Error: Record with ID '${itemId}' was not found.`);
          }
          
          // Re-throw other API errors to be caught by the outer catch
          throw apiError;
        }
      } catch (error) {
        return {
          content: [{
            type: "text" as const,
            text: `Error retrieving DatoCMS record references: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );
};
