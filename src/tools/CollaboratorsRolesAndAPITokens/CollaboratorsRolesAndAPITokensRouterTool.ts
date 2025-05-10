import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  collaboratorSchemas,
  collaboratorActionsList,
  roleActionEnum,
  roleSchemas,
  apiTokenActionEnum,
  apiTokenSchemas
} from "./schemas.js";
import { createResponse } from "../../utils/responseHandlers.js";
import { createErrorResponse } from "../../utils/errorHandlers.js";

// Import handlers from subdirectories for collaborators
import {
  createInvitationHandler,
  listInvitationsHandler,
  retrieveInvitationHandler,
  destroyInvitationHandler,
  resendInvitationHandler
} from "./Collaborators/Invitations/handlers/index.js";

import {
  listUsersHandler,
  retrieveUserHandler
} from "./Collaborators/Read/handlers/index.js";

import {
  updateUserHandler
} from "./Collaborators/Update/handlers/index.js";

import {
  destroyUserHandler
} from "./Collaborators/Delete/handlers/index.js";

import {
  inviteUserHandler
} from "./Collaborators/Create/handlers/index.js";

// Import handlers from subdirectories for roles
import { createRoleHandler } from "./Roles/Create/handlers/index.js";
import { listRolesHandler } from "./Roles/Read/handlers/index.js";
import { retrieveRoleHandler } from "./Roles/Read/handlers/index.js";
import { updateRoleHandler } from "./Roles/Update/handlers/index.js";
import { destroyRoleHandler } from "./Roles/Delete/handlers/index.js";
import { duplicateRoleHandler } from "./Roles/Duplicate/handlers/index.js";

// Import handlers from subdirectories for API tokens
import { createTokenHandler } from "./APITokens/Create/handlers/index.js";
import { listTokensHandler, retrieveTokenHandler } from "./APITokens/Read/handlers/index.js";
import { updateTokenHandler } from "./APITokens/Update/handlers/index.js";
import { destroyTokenHandler } from "./APITokens/Delete/handlers/index.js";
import { rotateTokenHandler } from "./APITokens/Rotate/handlers/index.js";

// Annotate the args parameter with the discriminated union type for collaborators
type CollaboratorToolArgs = {
  action: string;
  args?: Record<string, unknown>;
};

// Type for the action parameter for collaborators
type CollaboratorAction = keyof typeof collaboratorSchemas;

// Type map for action arguments to help with type safety for collaborators
type CollaboratorActionArgsMap = {
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
 * Registers the CollaboratorsRolesAndAPITokens Router tool with the MCP server
 * This router combines functionality for collaborators, roles, and API tokens
 */
export const registerPermissionsRouter = (server: McpServer) => {
  // Register Collaborators Router
  registerCollaboratorRouter(server);

  // Register Roles Router
  registerRolesRouter(server);

  // Register API Tokens Router
  registerAPITokensRouter(server);
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
              return createInvitationHandler(validatedArgs as CollaboratorActionArgsMap['invitation_create']);
            case "invitation_list":
              return listInvitationsHandler(validatedArgs as CollaboratorActionArgsMap['invitation_list']);
            case "invitation_retrieve":
              return retrieveInvitationHandler(validatedArgs as CollaboratorActionArgsMap['invitation_retrieve']);
            case "invitation_destroy":
              return destroyInvitationHandler(validatedArgs as CollaboratorActionArgsMap['invitation_destroy']);
            case "invitation_resend":
              return resendInvitationHandler(validatedArgs as CollaboratorActionArgsMap['invitation_resend']);

            // User operations
            case "user_list":
              return listUsersHandler(validatedArgs as CollaboratorActionArgsMap['user_list']);
            case "user_retrieve":
              return retrieveUserHandler(validatedArgs as CollaboratorActionArgsMap['user_retrieve']);
            case "user_update":
              return updateUserHandler(validatedArgs as CollaboratorActionArgsMap['user_update']);
            case "user_destroy":
              return destroyUserHandler(validatedArgs as CollaboratorActionArgsMap['user_destroy']);
            case "user_invite":
              return inviteUserHandler(validatedArgs as CollaboratorActionArgsMap['user_invite']);

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
 * Register the Roles router with the MCP server
 */
export const registerRolesRouter = (server: McpServer) => {
  server.tool(
    "datocms_roles",
    {
      action: roleActionEnum,
      args: z.record(z.any()).optional().describe("Arguments for the action to perform.")
    },
    {
      title: "DatoCMS Role Operations",
      description: "Executes DatoCMS role-related operations with the specified parameters."
    },
    async ({ action, args = {} }) => {
      try {
        // Validate input parameters based on the action
        const schema = roleSchemas[action as keyof typeof roleSchemas];
        const params = schema.parse(args);

        // Route to the appropriate handler
        switch (action) {
          case "create_role":
            return await createRoleHandler(params as z.infer<typeof roleSchemas.create_role>);
          case "list_roles":
            return await listRolesHandler(params as z.infer<typeof roleSchemas.list_roles>);
          case "retrieve_role":
            return await retrieveRoleHandler(params as z.infer<typeof roleSchemas.retrieve_role>);
          case "update_role":
            return await updateRoleHandler(params as z.infer<typeof roleSchemas.update_role>);
          case "destroy_role":
            return await destroyRoleHandler(params as z.infer<typeof roleSchemas.destroy_role>);
          case "duplicate_role":
            return await duplicateRoleHandler(params as z.infer<typeof roleSchemas.duplicate_role>);
          default:
            throw new Error(`Unsupported action: ${action}`);
        }
      } catch (error) {
        return createErrorResponse(`Error performing role operation: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );
};

/**
 * Register the API Tokens router with the MCP server
 */
export const registerAPITokensRouter = (server: McpServer) => {
  server.tool(
    "datocms_api_tokens",
    {
      action: apiTokenActionEnum,
      args: z.record(z.any()).optional().describe("Arguments for the action to perform.")
    },
    {
      title: "DatoCMS API Token Operations",
      description: "Executes DatoCMS API token-related operations with the specified parameters."
    },
    async ({ action, args = {} }) => {
      try {
        // Validate input parameters based on the action
        const schema = apiTokenSchemas[action as keyof typeof apiTokenSchemas];
        const params = schema.parse(args);

        // Route to the appropriate handler
        switch (action) {
          case "create_token":
            return await createTokenHandler(params as z.infer<typeof apiTokenSchemas.create_token>);
          case "list_tokens":
            return await listTokensHandler(params as z.infer<typeof apiTokenSchemas.list_tokens>);
          case "retrieve_token":
            return await retrieveTokenHandler(params as z.infer<typeof apiTokenSchemas.retrieve_token>);
          case "update_token":
            return await updateTokenHandler(params as z.infer<typeof apiTokenSchemas.update_token>);
          case "destroy_token":
            return await destroyTokenHandler(params as z.infer<typeof apiTokenSchemas.destroy_token>);
          case "rotate_token":
            return await rotateTokenHandler(params as z.infer<typeof apiTokenSchemas.rotate_token>);
          default:
            throw new Error(`Unsupported action: ${action}`);
        }
      } catch (error) {
        return createErrorResponse(`Error performing API token operation: ${error instanceof Error ? error.message : String(error)}`);
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