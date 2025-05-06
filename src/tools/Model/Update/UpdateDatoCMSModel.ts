import { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { isAuthorizationError, isNotFoundError, createErrorResponse } from "../../../utils/errorHandlers.js";
import { createResponse } from "../../../utils/responseHandlers.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Registers the UpdateDatoCMSModel tool with the MCP server
 */
export const registerUpdateDatoCMSModel = (server: McpServer) => {
  server.tool(
    // Tool name
    "UpdateDatoCMSModel",
    // Parameter schema with types
    {
      apiToken: z.string().describe("DatoCMS API token for authentication."),
      modelIdOrApiKey: z.string().describe("The ID or API key of the model to update."),
      name: z.string().optional().describe("Name of the model."),
      api_key: z.string().optional().describe("API key of the model."),
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
      meta: z.object({
        has_singleton_item: z.boolean().optional().describe("If this model is single-instance, this tells the single-instance record has already been created or not.")
      }).optional().describe("Meta properties for the model."),
      environment: z.string().optional().describe("The ID of a specific environment to target (defaults to primary environment).")
    },
    // Annotations for the tool
    {
      title: "Update DatoCMS Model",
      description: "Updates an existing model (item type) in your DatoCMS project.",
      readOnlyHint: false, // This tool modifies resources
      destructiveHint: false // This tool doesn't destroy anything
    },
    // Handler function for updating a model
    async (params) => {
      try {
        const { apiToken, modelIdOrApiKey, environment, ...updateData } = params;
        
        // Initialize DatoCMS client
        const clientParameters = environment ? { apiToken, environment } : { apiToken };
        const client = buildClient(clientParameters);
        
        try {
          // Update the model
          const model = await client.itemTypes.update(modelIdOrApiKey, updateData);
          
          return createResponse(JSON.stringify(model, null, 2));
          
        } catch (apiError: unknown) {
          if (isAuthorizationError(apiError)) {
            return createErrorResponse("Error: Please provide a valid DatoCMS API token. The token you provided was rejected by the DatoCMS API.");
          }
          
          if (isNotFoundError(apiError)) {
            return createErrorResponse(`Error: Model with ID or API key '${modelIdOrApiKey}' was not found.`);
          }
          
          // Re-throw other API errors to be caught by the outer catch
          throw apiError;
        }
      } catch (error: unknown) {
        return {
          content: [{
            type: "text" as const,
            text: `Error updating model: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );
};
