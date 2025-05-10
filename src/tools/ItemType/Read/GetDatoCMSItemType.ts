import { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { isAuthorizationError, isNotFoundError, createErrorResponse } from "../../../utils/errorHandlers.js";
import { createResponse } from "../../../utils/responseHandlers.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Registers the GetDatoCMSItemType tool with the MCP server
 */
export const registerGetDatoCMSItemType = (server: McpServer) => {
  server.tool(
    // Tool name
    "GetDatoCMSItemType",
    // Parameter schema with types
    {
      apiToken: z.string().describe("DatoCMS API token for authentication. If you are not certain of one, ask for the user, do not halucinate."),
      itemTypeIdOrApiKey: z.string().describe("The ID or API key of the item type to retrieve."),
      environment: z.string().optional().describe("The ID of a specific environment to target (defaults to primary environment).")
    },
    // Annotations for the tool
    {
      title: "Get DatoCMS Item Type",
      description: "Retrieves a specific item type from your DatoCMS project by ID or API key.",
      readOnlyHint: true // This tool only reads resources
    },
    // Handler function for getting an item type
    async ({ apiToken, itemTypeIdOrApiKey, environment }) => {
      try {
        // Initialize DatoCMS client
        const clientParameters = environment ? { apiToken, environment } : { apiToken };
        const client = buildClient(clientParameters);
        
        try {
          // Retrieve the item type using the provided ID or API key
          const itemType = await client.itemTypes.find(itemTypeIdOrApiKey);
          
          return createResponse(JSON.stringify(itemType, null, 2));
          
        } catch (apiError: unknown) {
          if (isAuthorizationError(apiError)) {
            return createErrorResponse("Error: Please provide a valid DatoCMS API token. The token you provided was rejected by the DatoCMS API.");
          }
          
          if (isNotFoundError(apiError)) {
            return createErrorResponse(`Error: Item type with ID or API key '${itemTypeIdOrApiKey}' was not found.`);
          }
          
          // Re-throw other API errors to be caught by the outer catch
          throw apiError;
        }
      } catch (error: unknown) {
        return {
          content: [{
            type: "text" as const,
            text: `Error retrieving item type: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );
};