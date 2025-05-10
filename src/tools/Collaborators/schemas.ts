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