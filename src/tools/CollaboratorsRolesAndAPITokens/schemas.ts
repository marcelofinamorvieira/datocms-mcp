import { z } from "zod";

/**
 * Schemas for all collaborator-related actions.
 * These schemas are used for both the collaborators router and parameter tools.
 */
export const collaboratorSchemas = {
  // Invitation operations
  invitation_create: z.object({
    apiToken: z.string().describe("DatoCMS API token for authentication. If you are not certain of one, ask for the user, do not halucinate."),
    email: z.string().email().describe("Email address for the invitation recipient"),
    role: z.union([
      z.enum(["admin", "editor", "developer", "seo", "contributor"]),
      z.string().regex(/^[0-9]+$/).describe("Role ID"),
      z.object({
        id: z.string().describe("Role ID"),
        type: z.literal("role").describe("Resource type")
      })
    ]).describe("Role to assign to the invited user"),
    environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
  }),

  invitation_list: z.object({
    apiToken: z.string().describe("DatoCMS API token for authentication. If you are not certain of one, ask for the user, do not halucinate."),
    environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
  }),

  invitation_retrieve: z.object({
    apiToken: z.string().describe("DatoCMS API token for authentication. If you are not certain of one, ask for the user, do not halucinate."),
    invitationId: z.string().describe("ID of the invitation to retrieve"),
    environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
  }),

  invitation_destroy: z.object({
    apiToken: z.string().describe("DatoCMS API token for authentication. If you are not certain of one, ask for the user, do not halucinate."),
    invitationId: z.string().describe("ID of the invitation to delete"),
    environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
  }),

  invitation_resend: z.object({
    apiToken: z.string().describe("DatoCMS API token for authentication. If you are not certain of one, ask for the user, do not halucinate."),
    invitationId: z.string().describe("ID of the invitation to resend"),
    environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
  }),

  // User operations
  user_list: z.object({
    apiToken: z.string().describe("DatoCMS API token for authentication. If you are not certain of one, ask for the user, do not halucinate."),
    environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
  }),

  user_retrieve: z.object({
    apiToken: z.string().describe("DatoCMS API token for authentication. If you are not certain of one, ask for the user, do not halucinate."),
    userId: z.string().describe("ID of the user to retrieve"),
    environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
  }),

  user_update: z.object({
    apiToken: z.string().describe("DatoCMS API token for authentication. If you are not certain of one, ask for the user, do not halucinate."),
    userId: z.string().describe("ID of the user to update"),
    email: z.string().email().optional().describe("Email of the user"),
    first_name: z.string().optional().describe("First name of the user"),
    last_name: z.string().optional().describe("Last name of the user"),
    role_id: z.string().optional().describe("Role ID to assign to the user"),
    environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
  }),

  user_destroy: z.object({
    apiToken: z.string().describe("DatoCMS API token for authentication. If you are not certain of one, ask for the user, do not halucinate."),
    userId: z.string().describe("ID of the user to destroy"),
    environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
  }),

  user_invite: z.object({
    apiToken: z.string().describe("DatoCMS API token for authentication. If you are not certain of one, ask for the user, do not halucinate."),
    email: z.string().email().describe("Email of the user to invite"),
    role_id: z.string().describe("Role ID to assign to the user"),
    first_name: z.string().optional().describe("First name of the user"),
    last_name: z.string().optional().describe("Last name of the user"),
    environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
  })
};

// Create an array of all available collaborator actions for the enum
export const collaboratorActionsList = Object.keys(collaboratorSchemas) as Array<keyof typeof collaboratorSchemas>;

// Common action enums for roles
export const roleActionEnum = z.enum([
  "create_role",
  "list_roles",
  "retrieve_role",
  "update_role",
  "destroy_role",
  "duplicate_role",
]);

// Schema for creating a role
export const createRoleSchema = z.object({
  apiToken: z.string().describe("DatoCMS API token for authentication. If you are not certain of one, ask for the user, do not halucinate."),
  name: z.string().describe("Name of the role"),
  can_edit_schema: z.boolean().optional().describe("Whether the role can edit schema"),
  can_edit_others_content: z.boolean().optional().describe("Whether the role can edit content created by other users"),
  can_publish_content: z.boolean().optional().describe("Whether the role can publish content"),
  can_edit_favicon: z.boolean().optional().describe("Whether the role can edit the favicon"),
  can_access_environments: z.boolean().optional().describe("Whether the role can access environments"),
  can_perform_site_search: z.boolean().optional().describe("Whether the role can perform site search"),
  can_edit_site_entity: z.boolean().optional().describe("Whether the role can edit site entity"),
  environment: z.string().optional().describe("The name of the DatoCMS environment to interact with."),
});

// Schema for listing roles
export const listRolesSchema = z.object({
  apiToken: z.string().describe("DatoCMS API token for authentication. If you are not certain of one, ask for the user, do not halucinate."),
  environment: z.string().optional().describe("The name of the DatoCMS environment to interact with."),
});

// Schema for retrieving a role
export const retrieveRoleSchema = z.object({
  apiToken: z.string().describe("DatoCMS API token for authentication. If you are not certain of one, ask for the user, do not halucinate."),
  roleId: z.string().describe("ID of the role to retrieve"),
  environment: z.string().optional().describe("The name of the DatoCMS environment to interact with."),
});

// Schema for updating a role
export const updateRoleSchema = z.object({
  apiToken: z.string().describe("DatoCMS API token for authentication. If you are not certain of one, ask for the user, do not halucinate."),
  roleId: z.string().describe("ID of the role to update"),
  name: z.string().optional().describe("Name of the role"),
  can_edit_schema: z.boolean().optional().describe("Whether the role can edit schema"),
  can_edit_others_content: z.boolean().optional().describe("Whether the role can edit content created by other users"),
  can_publish_content: z.boolean().optional().describe("Whether the role can publish content"),
  can_edit_favicon: z.boolean().optional().describe("Whether the role can edit the favicon"),
  can_access_environments: z.boolean().optional().describe("Whether the role can access environments"),
  can_perform_site_search: z.boolean().optional().describe("Whether the role can perform site search"),
  can_edit_site_entity: z.boolean().optional().describe("Whether the role can edit site entity"),
  environment: z.string().optional().describe("The name of the DatoCMS environment to interact with."),
});

// Schema for destroying a role
export const destroyRoleSchema = z.object({
  apiToken: z.string().describe("DatoCMS API token for authentication. If you are not certain of one, ask for the user, do not halucinate."),
  roleId: z.string().describe("ID of the role to destroy"),
  environment: z.string().optional().describe("The name of the DatoCMS environment to interact with."),
});

// Schema for duplicating a role
export const duplicateRoleSchema = z.object({
  apiToken: z.string().describe("DatoCMS API token for authentication. If you are not certain of one, ask for the user, do not halucinate."),
  roleId: z.string().describe("ID of the role to duplicate"),
  environment: z.string().optional().describe("The name of the DatoCMS environment to interact with."),
});

// Export schemas by action for easy access
export const roleSchemas = {
  create_role: createRoleSchema,
  list_roles: listRolesSchema,
  retrieve_role: retrieveRoleSchema,
  update_role: updateRoleSchema,
  destroy_role: destroyRoleSchema,
  duplicate_role: duplicateRoleSchema,
} as const;

// Common action enums for API tokens
export const apiTokenActionEnum = z.enum([
  "create_token",
  "list_tokens",
  "retrieve_token",
  "update_token",
  "destroy_token",
  "rotate_token",
]);

// Schema for creating an API token
export const createTokenSchema = z.object({
  apiToken: z.string().describe("DatoCMS API token for authentication. If you are not certain of one, ask for the user, do not halucinate."),
  name: z.string().describe("Name of the API token"),
  role: z.union([
    z.enum(["admin", "editor", "developer", "seo", "contributor"]),
    z.string().regex(/^[0-9]+$/).describe("Role ID"),
    z.object({
      id: z.string().describe("Role ID"),
      type: z.literal("role").describe("Resource type")
    })
  ]).describe("Role to assign to the API token"),
  can_access_cda: z.boolean().describe("Whether the token can access the Content Delivery API published content"),
  can_access_cda_preview: z.boolean().describe("Whether the token can access the Content Delivery API draft content"),
  can_access_cma: z.boolean().describe("Whether the token can access the Content Management API"),
  environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
});

// Schema for listing API tokens
export const listTokensSchema = z.object({
  apiToken: z.string().describe("DatoCMS API token for authentication. If you are not certain of one, ask for the user, do not halucinate."),
  environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
});

// Schema for retrieving an API token
export const retrieveTokenSchema = z.object({
  apiToken: z.string().describe("DatoCMS API token for authentication. If you are not certain of one, ask for the user, do not halucinate."),
  tokenId: z.string().describe("ID of the API token to retrieve"),
  environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
});

// Schema for updating an API token
export const updateTokenSchema = z.object({
  apiToken: z.string().describe("DatoCMS API token for authentication. If you are not certain of one, ask for the user, do not halucinate."),
  tokenId: z.string().describe("ID of the API token to update"),
  name: z.string().describe("Name of the API token"),
  role: z.union([
    z.enum(["admin", "editor", "developer", "seo", "contributor"]),
    z.string().regex(/^[0-9]+$/).describe("Role ID"),
    z.object({
      id: z.string().describe("Role ID"),
      type: z.literal("role").describe("Resource type")
    }),
    z.null()
  ]).describe("Role to assign to the API token (can be null)"),
  can_access_cda: z.boolean().describe("Whether the token can access the Content Delivery API published content"),
  can_access_cda_preview: z.boolean().describe("Whether the token can access the Content Delivery API draft content"),
  can_access_cma: z.boolean().describe("Whether the token can access the Content Management API"),
  environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
});

// Schema for destroying an API token
export const destroyTokenSchema = z.object({
  apiToken: z.string().describe("DatoCMS API token for authentication. If you are not certain of one, ask for the user, do not halucinate."),
  tokenId: z.string().describe("ID of the API token to destroy"),
  environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
});

// Schema for rotating an API token
export const rotateTokenSchema = z.object({
  apiToken: z.string().describe("DatoCMS API token for authentication. If you are not certain of one, ask for the user, do not halucinate."),
  tokenId: z.string().describe("ID of the API token to rotate"),
  environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
});

// Export schemas by action for easy access
export const apiTokenSchemas = {
  create_token: createTokenSchema,
  list_tokens: listTokensSchema,
  retrieve_token: retrieveTokenSchema,
  update_token: updateTokenSchema,
  destroy_token: destroyTokenSchema,
  rotate_token: rotateTokenSchema,
} as const;