import { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { isAuthorizationError, isNotFoundError, createErrorResponse } from "../../../utils/errorHandlers.js";
import { createResponse } from "../../../utils/responseHandlers.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { returnMostPopulatedLocale } from "../../../utils/returnMostPopulatedLocale.js";

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
      itemId: z.string().describe("The ID of the DatoCMS record for which to find referencing (linking) records that point to it."),
      version: z.enum(["published", "current"]).optional().describe("Whether to retrieve the published version ('published') or the latest draft ('current'). Default is 'current'."),
      returnAllLocales: z.boolean().optional().describe("If true, returns all locale versions for each field instead of only the most populated locale. Default is false to save on token usage."),
      nested: z.boolean().optional().describe("For Modular Content, Structured Text and Single Block fields. If set to true, returns full payload for nested blocks instead of just their IDs. Default is true."),
      returnOnlyIds: z.boolean().optional().describe("If true, returns only an array of record IDs instead of complete records. Use this to save on tokens and context window space when only IDs are needed. These IDs can then be used with GetDatoCMSRecordById to get detailed information. Default is false."),
      environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
    },
    // Annotations for the tool
    {
      title: "Get Records Linking to a DatoCMS Record",
      description: "Retrieves all DatoCMS records that link to a specific record by its ID.",
      readOnlyHint: true // Indicates this tool doesn't modify any resources
    },
    // Handler function for retrieving referencing records
    async ({ apiToken, itemId, version = "current", returnAllLocales = false, nested = true, returnOnlyIds = false, environment }) => {
      try {
        // Initialize DatoCMS client
        const clientParameters = environment ? { apiToken, environment } : { apiToken };
        const client = buildClient(clientParameters);
        
        try {
          // Retrieve records that reference the specified item with nested parameter
          const referencingItems = await client.items.references(itemId, { nested, version });

          // Return empty result message if no items found
          if (referencingItems.length === 0) {
            return {
              content: [{
                type: "text" as const,
                text: "No items found linking to the specified record."
              }]
            };
          }
          
          // If returnOnlyIds is true, return just the IDs using map for cleaner code
          if (returnOnlyIds) {
            const itemIds = referencingItems.map(item => item.id);
            return createResponse(JSON.stringify(itemIds, null, 2));
          }
          
          // Process the items to filter locales (saves on tokens) unless returnAllLocales is true
          const processedItems = returnMostPopulatedLocale(referencingItems, returnAllLocales);
          
          // Convert to JSON and create response (will be chunked only if necessary)
          return createResponse(JSON.stringify(processedItems, null, 2));
          
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
