import { z } from "zod";

/**
 * Schemas for all environment-related actions.
 * These schemas are extracted from the original environment tool definitions
 * and are used for both the environments router and parameter tools.
 */
export const environmentSchemas = {
  // Environment retrieval operations
  retrieve: z.object({
    apiToken: z.string().describe("DatoCMS API token for authentication. If you are not certain of one, ask for the user, do not hallucinate."),
    environmentId: z.string().describe("The ID of the environment to retrieve.")
  }),

  // Environment listing operations
  list: z.object({
    apiToken: z.string().describe("DatoCMS API token for authentication. If you are not certain of one, ask for the user, do not hallucinate.")
  }),

  // Environment deletion operations
  delete: z.object({
    apiToken: z.string().describe("DatoCMS API token for authentication. If you are not certain of one, ask for the user, do not hallucinate."),
    environmentId: z.string().describe("The ID of the environment to delete."),
    confirmation: z.string().describe("Type 'confirm' to confirm the deletion of the environment. THIS OPERATION CANNOT BE UNDONE.")
  }),

  // Environment renaming operations
  rename: z.object({
    apiToken: z.string().describe("DatoCMS API token for authentication. If you are not certain of one, ask for the user, do not hallucinate."),
    environmentId: z.string().describe("The ID of the environment to rename."),
    newId: z.string().describe("The new ID for the environment.")
  }),

  // Environment promotion operations
  promote: z.object({
    apiToken: z.string().describe("DatoCMS API token for authentication. If you are not certain of one, ask for the user, do not hallucinate."),
    environmentId: z.string().describe("The ID of the environment to promote to primary status.")
  }),

  // Environment forking operations
  fork: z.object({
    apiToken: z.string().describe("DatoCMS API token for authentication. If you are not certain of one, ask for the user, do not hallucinate."),
    environmentId: z.string().describe("The ID of the environment to fork."),
    newId: z.string().describe("The ID for the new environment."),
    fast: z.boolean().optional().describe("If true, the fork will be created without copying records (faster but incomplete)."),
    force: z.boolean().optional().describe("If true, the fork operation will proceed even if there are warnings.")
  }),

  // Maintenance mode operations
  maintenance_status: z.object({
    apiToken: z.string().describe("DatoCMS API token for authentication. If you are not certain of one, ask for the user, do not hallucinate.")
  }),

  maintenance_activate: z.object({
    apiToken: z.string().describe("DatoCMS API token for authentication. If you are not certain of one, ask for the user, do not hallucinate."),
    force: z.boolean().optional().describe("If true, maintenance mode will be activated even if there are active jobs.")
  }),

  maintenance_deactivate: z.object({
    apiToken: z.string().describe("DatoCMS API token for authentication. If you are not certain of one, ask for the user, do not hallucinate.")
  })
};

// Create an array of all available environment actions for the enum
export const environmentActionsList = Object.keys(environmentSchemas) as Array<keyof typeof environmentSchemas>;