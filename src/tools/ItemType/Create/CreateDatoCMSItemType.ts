import { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { isAuthorizationError, createErrorResponse } from "../../../utils/errorHandlers.js";
import { createResponse } from "../../../utils/responseHandlers.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Registers the CreateDatoCMSItemType tool with the MCP server
 */
export const registerCreateDatoCMSItemType = (server: McpServer) => {
  server.tool(
    // Tool name
    "CreateDatoCMSItemType",
    // Parameter schema with types
    {
      apiToken: z.string().describe("DatoCMS API token for authentication. If you are not certain of one, ask for the user, do not halucinate."),
      name: z.string().describe("The name of the new Item Type."),
      apiKey: z.string().describe("The API key to identify the item type (API-safe identifier)."),
      allLocalesRequired: z.boolean().optional().describe("Whether the item type requires content to be provided for all locales."),
      draftModeActive: z.boolean().optional().describe("Whether draft mode is active for this item type."),
      modularBlock: z.boolean().optional().describe("Whether the item type is a modular block."),
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
      title: "Create DatoCMS Item Type",
      description: "Creates a new item type in your DatoCMS project.",
      readOnlyHint: false
    },
    // Handler function for creating an item type
    async ({ 
      apiToken, 
      name, 
      apiKey, 
      allLocalesRequired, 
      draftModeActive, 
      modularBlock, 
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
          // Create the item type
          const itemTypeData = {
            name,
            api_key: apiKey,
            all_locales_required: allLocalesRequired,
            draft_mode_active: draftModeActive,
            modular_block: modularBlock,
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

          // Create the item type with required parameters
          const createdItemType = await client.itemTypes.create({
            name: name, // Required string parameter
            api_key: apiKey, // Required string parameter
            ...Object.entries(cleanedItemTypeData)
              .filter(([k, v]) => v !== undefined && !['name', 'api_key'].includes(k))
              .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {})
          });
          
          return createResponse(JSON.stringify(createdItemType, null, 2));
          
        } catch (apiError: unknown) {
          if (isAuthorizationError(apiError)) {
            return createErrorResponse("Error: Please provide a valid DatoCMS API token. The token you provided was rejected by the DatoCMS API.");
          }
          
          // Re-throw other API errors to be caught by the outer catch
          throw apiError;
        }
      } catch (error: unknown) {
        return {
          content: [{
            type: "text" as const,
            text: `Error creating item type: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );
};