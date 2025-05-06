import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { projectSchemas, projectActionsList } from "./schemas.js";
import { createResponse } from "../../utils/responseHandlers.js";
import { createErrorResponse } from "../../utils/errorHandlers.js";

// Import handlers from subdirectories
import { getProjectInfoHandler } from "./Info/handlers/index.js";
import { updateSiteSettingsHandler } from "./Update/handlers/index.js";
import { 
  listSubscriptionFeaturesHandler,
  listUsagesAndLimitsHandler 
} from "./Subscription/handlers/index.js";

// Annotate the args parameter with the discriminated union type
type ProjectToolArgs = {
  action: string;
  args?: Record<string, unknown>;
};

// Type for the action parameter
type ProjectAction = keyof typeof projectSchemas;

// Type map for action arguments to help with type safety
type ActionArgsMap = {
  get_info: z.infer<typeof projectSchemas.get_info>;
  update_site_settings: z.infer<typeof projectSchemas.update_site_settings>;
  list_subscription_features: z.infer<typeof projectSchemas.list_subscription_features>;
  list_usages_and_limits: z.infer<typeof projectSchemas.list_usages_and_limits>;
};

/**
 * Registers the Project Router tool with the MCP server
 */
export const registerProjectRouter = (server: McpServer) => {
  const actionEnum = z.enum(projectActionsList as [string, ...string[]]);
  
  server.tool(
    // Tool name - Using the new datocms_execute pattern with a specific prefix
    "datocms_project",
    // Parameter schema with types using discriminated union based on action
    {
      action: actionEnum,
      args: z.record(z.any()).optional().describe("Arguments for the action to perform. You MUST call datocms_parameters first to know what arguments are required for this action."),
    },
    // Annotations for the tool
    {
      title: "DatoCMS Project Operations",
      description: "Executes DatoCMS project-related operations with the specified parameters. YOU MUST use the 'datocms_parameters' tool FIRST to get the required parameters for each action."
    },
    // Handler function for the project router
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
  "resource": "project",
  "action": "${action}"
}

This will show you all the required parameters and their types.`);
        }
        
        // Get the schema for the action
        const validAction = action as ProjectAction;
        const actionSchema = projectSchemas[validAction];
        if (!actionSchema) {
          return createErrorResponse(`Error: Unsupported action '${action}'. Valid actions are: ${projectActionsList.join(', ')}`);
        }
        
        // Validate arguments against the schema
        try {
          const validatedArgs = actionSchema.parse(args);
          
          // Route to the appropriate handler based on the action
          switch (validAction) {
            // Project info operations
            case "get_info":
              return getProjectInfoHandler(validatedArgs as ActionArgsMap['get_info']);
            
            // Site settings operations
            case "update_site_settings":
              return updateSiteSettingsHandler(validatedArgs as ActionArgsMap['update_site_settings']);
            
            // Subscription operations
            case "list_subscription_features":
              return listSubscriptionFeaturesHandler(validatedArgs as ActionArgsMap['list_subscription_features']);
            case "list_usages_and_limits":
              return listUsagesAndLimitsHandler(validatedArgs as ActionArgsMap['list_usages_and_limits']);
            
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

To see proper documentation, use the 'datocms_parameters' tool first with:\n\n  action: "datocms_parameters",\n  args: {\n    resource: "project",\n    action: "${action}"\n  }`);
          }
          return createErrorResponse(`Error validating arguments: ${error instanceof Error ? error.message : String(error)}`);
        }
      } catch (error: unknown) {
        return createErrorResponse(`Error in Project Router: ${error instanceof Error ? error.message : String(error)}`);
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
