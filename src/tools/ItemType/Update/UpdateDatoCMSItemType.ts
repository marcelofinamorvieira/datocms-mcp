import { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { isAuthorizationError, isNotFoundError, createErrorResponse } from "../../../utils/errorHandlers.js";
import { createResponse } from "../../../utils/responseHandlers.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Registers the UpdateDatoCMSItemType tool with the MCP server
 */
export const registerUpdateDatoCMSItemType = (server: McpServer) => {
  server.tool(
    // Tool name
    "UpdateDatoCMSItemType",
    // Parameter schema with types
    {
      apiToken: z.string().describe("DatoCMS API token for authentication. If you are not certain of one, ask for the user, do not halucinate."),
      itemTypeIdOrApiKey: z.string().describe("The ID or API key of the item type to update."),
      name: z.string().optional().describe("The updated name of the item type."),
      apiKey: z.string().optional().describe("The updated API key to identify the item type (API-safe identifier)."),
      allLocalesRequired: z.boolean().optional().describe("Whether the item type requires content to be provided for all locales."),
      draftModeActive: z.boolean().optional().describe("Whether draft mode is active for this item type."),
      orderingDirection: z.enum(["asc", "desc"]).optional().describe("The direction of the ordering."),
      orderingField: z.string().optional().describe("The field to use for ordering."),
      singleton: z.boolean().optional().describe("Whether the item type is a singleton."),
      sortable: z.boolean().optional().describe("Whether the item type is sortable."),
      titleField: z.string().optional().describe("The field to use as the title."),
      tree: z.boolean().optional().describe("Whether the item type is structured as a tree."),
      environment: z.string().optional().describe("The ID of a specific environment to target (defaults to primary environment).")
    },
    // Annotations for the tool
    {
      title: "Update DatoCMS Item Type",
      description: "Updates an existing item type in your DatoCMS project.",
      readOnlyHint: false
    },
    // Handler function for updating an item type
    async ({ 
      apiToken, 
      itemTypeIdOrApiKey, 
      name, 
      apiKey, 
      allLocalesRequired, 
      draftModeActive, 
      orderingDirection, 
      orderingField, 
      singleton, 
      sortable, 
      titleField, 
      tree, 
      environment 
    }) => {
      try {
        // Initialize DatoCMS client
        const clientParameters = environment ? { apiToken, environment } : { apiToken };
        const client = buildClient(clientParameters);
        
        try {
          // Build update data object
          const itemTypeData = {
            name,
            api_key: apiKey,
            all_locales_required: allLocalesRequired,
            draft_mode_active: draftModeActive,
            ordering_direction: orderingDirection,
            ordering_field: orderingField,
            singleton,
            sortable,
            title_field: titleField,
            tree
          };
          
          // Remove undefined values
          const cleanedItemTypeData = Object.fromEntries(
            Object.entries(itemTypeData).filter(([_, v]) => v !== undefined)
          );
          
          // Update the item type
          const updatedItemType = await client.itemTypes.update(itemTypeIdOrApiKey, cleanedItemTypeData);
          
          return createResponse(JSON.stringify(updatedItemType, null, 2));
          
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
            text: `Error updating item type: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );
};