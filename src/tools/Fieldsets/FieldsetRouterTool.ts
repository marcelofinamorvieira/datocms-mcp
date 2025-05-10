import { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { isAuthorizationError, isNotFoundError, createErrorResponse } from "../../utils/errorHandlers.js";
import { createResponse } from "../../utils/responseHandlers.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

// Import the fieldset action schemas and handlers
import { fieldsetSchemas, fieldsetActionsList } from "./schemas.js";

// Import handlers
import { createFieldsetHandler } from "./Create/handlers/createFieldsetHandler.js";
import { updateFieldsetHandler } from "./Update/handlers/updateFieldsetHandler.js";
import { getFieldsetHandler } from "./Read/handlers/getFieldsetHandler.js";
import { listFieldsetsHandler } from "./Read/handlers/listFieldsetsHandler.js";
import { destroyFieldsetHandler } from "./Delete/handlers/destroyFieldsetHandler.js";

// Define the types for our action arguments
type ActionArgsMap = {
  create: z.infer<typeof fieldsetSchemas.create>;
  update: z.infer<typeof fieldsetSchemas.update>;
  list: z.infer<typeof fieldsetSchemas.list>;
  get: z.infer<typeof fieldsetSchemas.get>;
  destroy: z.infer<typeof fieldsetSchemas.destroy>;
};

// Type for the action parameter
type FieldsetAction = keyof typeof fieldsetSchemas;

/**
 * Registers the Fieldsets Router tool with the MCP server
 */
export const registerFieldsetsRouter = (server: McpServer) => {
  const actionEnum = z.enum(fieldsetActionsList as [string, ...string[]]);
  
  server.tool(
    // Tool name
    "datocms_fieldset",
    // Parameter schema with types using discriminated union based on action
    {
      action: actionEnum,
      args: z.record(z.any()).optional().describe("Arguments for the action to perform. You MUST call datocms_parameters first to know what arguments are required for this action."),
    },
    // Annotations for the tool
    {
      title: "DatoCMS Fieldset",
      description: "Manage DatoCMS fieldsets - create, read, update, or delete fieldsets which organize and group fields within item types."
    },
    // Handler function for the fieldsets router
    async ({ action, args = {} }) => {
      try {
        // ALWAYS CHECK FOR PARAMETERS FIRST
        // If there are no arguments, or very few args for non-trivial operations,
        // redirect users to get_parameters first
        const shouldSuggestParams = (
          // These conditions indicate the user is likely not providing proper parameters
          Object.keys(args).length === 0
        );
        
        if (shouldSuggestParams) {
          return createErrorResponse(`⚠️ PARAMETERS REQUIRED: You need to specify the parameters for the '${action}' action. ⚠️

To get the required parameters, use the datocms_parameters tool first with:
{
  "resource": "fieldset",
  "action": "${action}"
}

This will show you all the required parameters and their types.`);
        }
        
        // Get the schema for the action
        const validAction = action as FieldsetAction;
        const actionSchema = fieldsetSchemas[validAction];
        if (!actionSchema) {
          return createErrorResponse(`Error: Unsupported action '${action}'. Valid actions are: ${fieldsetActionsList.join(', ')}`);
        }
        
        // Validate arguments against the schema
        try {
          const validatedArgs = actionSchema.parse(args);
          
          // Route to the appropriate handler based on the action
          switch (validAction) {
            case "create":
              return createFieldsetHandler(validatedArgs as ActionArgsMap['create']);
            case "update":
              return updateFieldsetHandler(validatedArgs as ActionArgsMap['update']);
            case "list":
              return listFieldsetsHandler(validatedArgs as ActionArgsMap['list']);
            case "get":
              return getFieldsetHandler(validatedArgs as ActionArgsMap['get']);
            case "destroy":
              return destroyFieldsetHandler(validatedArgs as ActionArgsMap['destroy']);
            default: {
              // This is a type check to ensure we've handled all possible actions
              const _exhaustiveCheck: never = validAction;
              return createErrorResponse(`Error: Unsupported action '${action}'. This is likely a bug.`);
            }
          }
        } catch (error) {
          if (error instanceof z.ZodError) {
            // Get the schema for documentation purposes
            const schemaInfo = formatSchemaForDisplay(actionSchema);
            
            // Format the validation error in a helpful way
            const errorFormatted = formatZodError(error);
            
            return createErrorResponse(`⚠️ VALIDATION ERROR: Your parameters for '${action}' are incorrect or incomplete! ⚠️

${errorFormatted}

REQUIRED PARAMETERS FOR '${action.toUpperCase()}' ACTION:
${JSON.stringify(schemaInfo, null, 2)}

To see proper documentation, use the 'datocms_parameters' tool first with:\n\n  action: "datocms_parameters",\n  args: {\n    resource: "fieldset",\n    action: "${action}"\n  }`);
          }
          return createErrorResponse(`Error validating arguments: ${error instanceof Error ? error.message : String(error)}`);
        }
      } catch (error: unknown) {
        return createErrorResponse(`Error in Fieldsets Router: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );
};

/**
 * Helper function to clean up and release resources when the MCP server is shut down
 */
export function destroy() {
  // Clean up code here if needed
}

// Helper function to format schema for display
function formatSchemaForDisplay(schema: z.ZodSchema) {
  // Extract structure and metadata from the schema
  const description = schema.description || "No description available";
  
  // Try to extract basic information about the schema
  try {
    // @ts-expect-error - Zod's type definitions are not consistent across versions
    const schemaDescription = schema.describe();
    
    // Add a note to use the get_parameters tool
    return {
      ...schemaDescription,
      note: "For more detailed parameter information, use the 'datocms_parameters' tool"
    };
  } catch (error) {
    // Fallback if the schema doesn't support describe()
    return {
      type: "object",
      description,
      note: "Schema details unavailable. Use the 'datocms_parameters' tool for parameter information."
    };
  }
}

// Helper function to format ZodError for display
function formatZodError(error: z.ZodError) {
  return error.issues.map(issue => `- ${issue.path.join('.')}: ${issue.message}`).join('\n');
}