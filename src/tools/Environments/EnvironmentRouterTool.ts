import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { environmentSchemas, environmentActionsList } from "./schemas.js";
import { createResponse } from "../../utils/responseHandlers.js";
import { createErrorResponse } from "../../utils/errorHandlers.js";

// Import handlers from subdirectories
import { retrieveEnvironmentHandler } from "./Retrieve/handlers/index.js";
import { listEnvironmentsHandler } from "./List/handlers/index.js";
import { deleteEnvironmentHandler } from "./Delete/handlers/index.js";
import { renameEnvironmentHandler } from "./Update/handlers/index.js";
import { promoteEnvironmentHandler } from "./Promote/handlers/index.js";
import { forkEnvironmentHandler } from "./Fork/handlers/index.js";
import { 
  fetchMaintenanceModeHandler,
  activateMaintenanceModeHandler,
  deactivateMaintenanceModeHandler
} from "./Maintenance/handlers/index.js";

// Annotate the args parameter with the discriminated union type
type EnvironmentToolArgs = {
  action: string;
  args?: Record<string, unknown>;
};

// Type for the action parameter
type EnvironmentAction = keyof typeof environmentSchemas;

// Type map for action arguments to help with type safety
type ActionArgsMap = {
  retrieve: z.infer<typeof environmentSchemas.retrieve>;
  list: z.infer<typeof environmentSchemas.list>;
  delete: z.infer<typeof environmentSchemas.delete>;
  rename: z.infer<typeof environmentSchemas.rename>;
  promote: z.infer<typeof environmentSchemas.promote>;
  fork: z.infer<typeof environmentSchemas.fork>;
  maintenance_status: z.infer<typeof environmentSchemas.maintenance_status>;
  maintenance_activate: z.infer<typeof environmentSchemas.maintenance_activate>;
  maintenance_deactivate: z.infer<typeof environmentSchemas.maintenance_deactivate>;
};

/**
 * Registers the Environment Router tool with the MCP server
 */
export const registerEnvironmentRouter = (server: McpServer) => {
  const actionEnum = z.enum(environmentActionsList as [string, ...string[]]);
  
  server.tool(
    // Tool name - Using the new datocms_execute pattern with a specific prefix
    "datocms_environments",
    // Parameter schema with types using discriminated union based on action
    {
      action: actionEnum,
      args: z.record(z.any()).optional().describe("Arguments for the action to perform. You MUST call datocms_parameters first to know what arguments are required for this action."),
    },
    // Annotations for the tool
    {
      title: "DatoCMS Environment Operations",
      description: "Executes DatoCMS environment-related operations with the specified parameters. YOU MUST use the 'datocms_parameters' tool FIRST to get the required parameters for each action."
    },
    // Handler function for the environment router
    async ({ action, args = {} }) => {
      try {
        // ALWAYS CHECK FOR PARAMETERS FIRST
        // If there are no arguments, redirect users to get_parameters first
        const shouldSuggestParams = (
          // These conditions indicate the user is likely not providing proper parameters
          Object.keys(args).length === 0
        );
        
        if (shouldSuggestParams) {
          return createErrorResponse(`⚠️ PARAMETERS REQUIRED: You need to specify the parameters for the '${action}' action. ⚠️

To get the required parameters, use the datocms_parameters tool first with:
{
  "resource": "environment",
  "action": "${action}"
}

This will show you all the required parameters and their types.`);
        }
        
        // Get the schema for the action
        const validAction = action as EnvironmentAction;
        const actionSchema = environmentSchemas[validAction];
        if (!actionSchema) {
          return createErrorResponse(`Error: Unsupported action '${action}'. Valid actions are: ${environmentActionsList.join(', ')}`);
        }
        
        // Validate arguments against the schema
        try {
          const validatedArgs = actionSchema.parse(args);
          
          // Route to the appropriate handler based on the action
          switch (validAction) {
            // Environment retrieval operations
            case "retrieve":
              return retrieveEnvironmentHandler(validatedArgs as ActionArgsMap['retrieve']);
            case "list":
              return listEnvironmentsHandler(validatedArgs as ActionArgsMap['list']);

            // Environment modification operations
            case "delete":
              return deleteEnvironmentHandler(validatedArgs as ActionArgsMap['delete']);
            case "rename":
              return renameEnvironmentHandler(validatedArgs as ActionArgsMap['rename']);
            case "promote":
              return promoteEnvironmentHandler(validatedArgs as ActionArgsMap['promote']);
            case "fork":
              return forkEnvironmentHandler(validatedArgs as ActionArgsMap['fork']);

            // Maintenance mode operations
            case "maintenance_status":
              return fetchMaintenanceModeHandler(validatedArgs as ActionArgsMap['maintenance_status']);
            case "maintenance_activate":
              return activateMaintenanceModeHandler(validatedArgs as ActionArgsMap['maintenance_activate']);
            case "maintenance_deactivate":
              return deactivateMaintenanceModeHandler(validatedArgs as ActionArgsMap['maintenance_deactivate']);
            
            default:
              return createErrorResponse(`Error: No handler implemented for action '${action}'. This is a server configuration error.`);
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

To see proper documentation, use the 'datocms_parameters' tool first with:\n\n  action: "datocms_parameters",\n  args: {\n    resource: "environment",\n    action: "${action}"\n  }`);
          }
          return createErrorResponse(`Error validating arguments: ${error instanceof Error ? error.message : String(error)}`);
        }
      } catch (error: unknown) {
        return createErrorResponse(`Error in Environment Router: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );
};

/**
 * Clean up function called when the server is shutting down
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