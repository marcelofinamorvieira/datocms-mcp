import { z } from "zod";

// Common action enums
export const actionEnum = z.enum([
  "create_role",
  "list_roles",
  "retrieve_role",
  "update_role",
  "destroy_role",
]);

// Schema for creating a role
export const createRoleSchema = z.object({
  apiToken: z.string().describe("DatoCMS API token for authentication."),
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
  apiToken: z.string().describe("DatoCMS API token for authentication."),
  environment: z.string().optional().describe("The name of the DatoCMS environment to interact with."),
});

// Schema for retrieving a role
export const retrieveRoleSchema = z.object({
  apiToken: z.string().describe("DatoCMS API token for authentication."),
  roleId: z.string().describe("ID of the role to retrieve"),
  environment: z.string().optional().describe("The name of the DatoCMS environment to interact with."),
});

// Schema for updating a role
export const updateRoleSchema = z.object({
  apiToken: z.string().describe("DatoCMS API token for authentication."),
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
  apiToken: z.string().describe("DatoCMS API token for authentication."),
  roleId: z.string().describe("ID of the role to destroy"),
  environment: z.string().optional().describe("The name of the DatoCMS environment to interact with."),
});

// Export schemas by action for easy access
export const schemas = {
  create_role: createRoleSchema,
  list_roles: listRolesSchema,
  retrieve_role: retrieveRoleSchema,
  update_role: updateRoleSchema,
  destroy_role: destroyRoleSchema,
} as const;