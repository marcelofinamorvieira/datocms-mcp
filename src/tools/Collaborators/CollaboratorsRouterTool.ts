import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { collaboratorSchemas, collaboratorActionsList } from "./schemas.js";
import { createResponse } from "../../utils/responseHandlers.js";
import { createErrorResponse } from "../../utils/errorHandlers.js";

// Import handlers from subdirectories (to be implemented)
import {
  createInvitationHandler,
  listInvitationsHandler,
  retrieveInvitationHandler,
  destroyInvitationHandler,
  resendInvitationHandler
} from "./Invitations/handlers/index.js";

// Import user handlers (to be implemented)
import {
  listUsersHandler,
  retrieveUserHandler
} from "./Read/handlers/index.js";

import {
  updateUserHandler
} from "./Update/handlers/index.js";

import {
  destroyUserHandler
} from "./Delete/handlers/index.js";

import {
  inviteUserHandler
} from "./Create/handlers/index.js";

// Annotate the args parameter with the discriminated union type
type CollaboratorToolArgs = {
  action: string;
  args?: Record<string, unknown>;
};

// Type for the action parameter
type CollaboratorAction = keyof typeof collaboratorSchemas;

// Type map for action arguments to help with type safety
type ActionArgsMap = {
  invitation_create: z.infer<typeof collaboratorSchemas.invitation_create>;
  invitation_list: z.infer<typeof collaboratorSchemas.invitation_list>;
  invitation_retrieve: z.infer<typeof collaboratorSchemas.invitation_retrieve>;
  invitation_destroy: z.infer<typeof collaboratorSchemas.invitation_destroy>;
  invitation_resend: z.infer<typeof collaboratorSchemas.invitation_resend>;
  user_list: z.infer<typeof collaboratorSchemas.user_list>;
  user_retrieve: z.infer<typeof collaboratorSchemas.user_retrieve>;
  user_update: z.infer<typeof collaboratorSchemas.user_update>;
  user_destroy: z.infer<typeof collaboratorSchemas.user_destroy>;
  user_invite: z.infer<typeof collaboratorSchemas.user_invite>;
};

/**
 * Registers the Collaborator Router tool with the MCP server
 */
export const registerCollaboratorRouter = (server: McpServer) => {
  const actionEnum = z.enum(collaboratorActionsList as [string, ...string[]]);
  
  server.tool(
    // Tool name - Using the datocms_collaborators pattern
    "datocms_collaborators",
    // Parameter schema with types using discriminated union based on action
    {
      action: actionEnum,
      args: z.record(z.any()).optional().describe("Arguments for the action to perform. You MUST call datocms_parameters first to know what arguments are required for this action."),
    },
    // Annotations for the tool
    {
      title: "DatoCMS Collaborator Operations",
      description: "Executes DatoCMS collaborator-related operations with the specified parameters. YOU MUST use the 'datocms_parameters' tool FIRST to get the required parameters for each action."
    },
    // Handler function for the collaborator router
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
  "resource": "collaborator",
  "action": "${action}"
}

This will show you all the required parameters and their types.`);
        }
        
        // Get the schema for the action
        const validAction = action as CollaboratorAction;
        const actionSchema = collaboratorSchemas[validAction];
        if (!actionSchema) {
          return createErrorResponse(`Error: Unsupported action '${action}'. Valid actions are: ${collaboratorActionsList.join(', ')}`);
        }
        
        // Validate arguments against the schema
        try {
          const validatedArgs = actionSchema.parse(args);
          
          // Route to the appropriate handler based on the action
          switch (validAction) {
            // Invitation operations
            case "invitation_create":
              return createInvitationHandler(validatedArgs as ActionArgsMap['invitation_create']);
            case "invitation_list":
              return listInvitationsHandler(validatedArgs as ActionArgsMap['invitation_list']);
            case "invitation_retrieve":
              return retrieveInvitationHandler(validatedArgs as ActionArgsMap['invitation_retrieve']);
            case "invitation_destroy":
              return destroyInvitationHandler(validatedArgs as ActionArgsMap['invitation_destroy']);
            case "invitation_resend":
              return resendInvitationHandler(validatedArgs as ActionArgsMap['invitation_resend']);

            // User operations
            case "user_list":
              return listUsersHandler(validatedArgs as ActionArgsMap['user_list']);
            case "user_retrieve":
              return retrieveUserHandler(validatedArgs as ActionArgsMap['user_retrieve']);
            case "user_update":
              return updateUserHandler(validatedArgs as ActionArgsMap['user_update']);
            case "user_destroy":
              return destroyUserHandler(validatedArgs as ActionArgsMap['user_destroy']);
            case "user_invite":
              return inviteUserHandler(validatedArgs as ActionArgsMap['user_invite']);

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

To see proper documentation, use the 'datocms_parameters' tool first with:\n\n  action: "datocms_parameters",\n  args: {\n    resource: "collaborator",\n    action: "${action}"\n  }`);
          }
          return createErrorResponse(`Error validating arguments: ${error instanceof Error ? error.message : String(error)}`);
        }
      } catch (error: unknown) {
        return createErrorResponse(`Error in Collaborator Router: ${error instanceof Error ? error.message : String(error)}`);
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