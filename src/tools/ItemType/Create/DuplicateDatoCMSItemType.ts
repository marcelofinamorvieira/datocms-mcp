import { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { isAuthorizationError, isNotFoundError, createErrorResponse } from "../../../utils/errorHandlers.js";
import { createResponse } from "../../../utils/responseHandlers.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Registers the DuplicateDatoCMSItemType tool with the MCP server
 */
export const registerDuplicateDatoCMSItemType = (server: McpServer) => {
  server.tool(
    // Tool name
    "DuplicateDatoCMSItemType",
    // Parameter schema with types
    {
      apiToken: z.string().describe("DatoCMS API token for authentication. If you are not certain of one, ask for the user, do not halucinate."),
      itemTypeIdOrApiKey: z.string().describe("The ID or API key of the item type to duplicate."),
      newName: z.string().describe("The name for the new duplicate item type."),
      newApiKey: z.string().describe("The API key for the new duplicate item type (API-safe identifier)."),
      environment: z.string().optional().describe("The ID of a specific environment to target (defaults to primary environment).")
    },
    // Annotations for the tool
    {
      title: "Duplicate DatoCMS Item Type",
      description: "Duplicates an existing item type in your DatoCMS project with a new name and API key.",
      readOnlyHint: false
    },
    // Handler function for duplicating an item type
    async ({ apiToken, itemTypeIdOrApiKey, newName, newApiKey, environment }) => {
      try {
        // Initialize DatoCMS client
        const clientParameters = environment ? { apiToken, environment } : { apiToken };
        const client = buildClient(clientParameters);
        
        try {
          // Find the original item type
          const originalItemType = await client.itemTypes.find(itemTypeIdOrApiKey);
          
          // Create a new item type based on the original
          const duplicatedItemType = await client.itemTypes.create({
            name: newName,
            api_key: newApiKey,
            all_locales_required: originalItemType.all_locales_required,
            draft_mode_active: originalItemType.draft_mode_active,
            modular_block: originalItemType.modular_block,
            ordering_direction: originalItemType.ordering_direction,
            ordering_field: originalItemType.ordering_field,
            singleton: originalItemType.singleton,
            sortable: originalItemType.sortable,
            title_field: originalItemType.title_field,
            tree: originalItemType.tree
          });
          
          // Duplicate fields (optional, depending on your requirements)
          // You could iterate through originalItemType's fields and create them for the new item type
          // This would require fetching the fields and then creating them for the new item type
          
          return createResponse(JSON.stringify(duplicatedItemType, null, 2));
          
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
            text: `Error duplicating item type: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );
};