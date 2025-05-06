import { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { isAuthorizationError, createErrorResponse } from "../../../utils/errorHandlers.js";
import { createResponse } from "../../../utils/responseHandlers.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Registers the CreateDatoCMSModel tool with the MCP server
 */
export const registerCreateDatoCMSModel = (server: McpServer) => {
  server.tool(
    // Tool name
    "CreateDatoCMSModel",
    // Parameter schema with types
    {
      apiToken: z.string().describe("DatoCMS API token for authentication."),
      name: z.string().describe("Name of the model."),
      api_key: z.string().describe("API key of the model."),
      id: z.string().optional().describe("Optional RFC 4122 UUID of item type expressed in URL-safe base64 format."),
      singleton: z.boolean().optional().describe("Whether the model is single-instance or not."),
      all_locales_required: z.boolean().optional().describe("Whether we require all the project locales to be present for each localized field or not."),
      sortable: z.boolean().optional().describe("Whether editors can sort records via drag & drop or not."),
      modular_block: z.boolean().optional().describe("Whether this model is a modular content block or not."),
      draft_mode_active: z.boolean().optional().describe("Whether draft/published mode is active or not."),
      draft_saving_active: z.boolean().optional().describe("Whether draft records can be saved without satisfying the validations or not."),
      tree: z.boolean().optional().describe("Whether editors can organize records in a tree or not."),
      ordering_direction: z.enum(["asc", "desc"]).nullable().optional().describe("If an ordering field is set, this fields specify the sorting direction."),
      ordering_meta: z.enum(["created_at", "updated_at", "first_published_at", "published_at"]).nullable().optional().describe("Specifies the model's sorting method. Cannot be set in concurrency with ordering_field."),
      collection_appearance: z.enum(["compact", "table"]).optional().describe("The way the model collection should be presented to the editors."),
      hint: z.string().nullable().optional().describe("A hint shown to editors to help them understand the purpose of this model/block."),
      inverse_relationships_enabled: z.boolean().optional().describe("Whether inverse relationships fields are expressed in GraphQL or not."),
      skip_menu_item_creation: z.boolean().optional().describe("Skip the creation of a menu item linked to the model."),
      menu_item_id: z.string().optional().describe("Explicitly specify the ID of the menu item that will be linked to the model."),
      schema_menu_item_id: z.string().optional().describe("Explicitly specify the ID of the schema menu item that will be linked to the model."),
      environment: z.string().optional().describe("The ID of a specific environment to target (defaults to primary environment).")
    },
    // Annotations for the tool
    {
      title: "Create DatoCMS Model",
      description: "Creates a new model (item type) in your DatoCMS project.",
      readOnlyHint: false, // This tool creates a new resource
      destructiveHint: false // This tool doesn't destroy anything
    },
    // Handler function for creating a model
    async (params) => {
      try {
        const { apiToken, environment, skip_menu_item_creation, menu_item_id, schema_menu_item_id, ...modelData } = params;
        
        // Initialize DatoCMS client
        const clientParameters = environment ? { apiToken, environment } : { apiToken };
        const client = buildClient(clientParameters);
        
        try {
          // Prepare query parameters
          const queryParams: Record<string, string | boolean> = {};
          
          if (skip_menu_item_creation !== undefined) {
            queryParams.skip_menu_item_creation = skip_menu_item_creation;
          }
          
          if (menu_item_id) {
            queryParams.menu_item_id = menu_item_id;
          }
          
          if (schema_menu_item_id) {
            queryParams.schema_menu_item_id = schema_menu_item_id;
          }
          
          // Create the model
          const model = await client.itemTypes.create(modelData, queryParams);
          
          return createResponse(JSON.stringify(model, null, 2));
          
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
            text: `Error creating model: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );
};
