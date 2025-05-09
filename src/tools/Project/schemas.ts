import { z } from "zod";

/**
 * Schemas for all project-related actions.
 * These schemas are extracted from the original project tool definitions
 * and are used for both the projects router and parameter tools.
 */
export const projectSchemas = {
  // Project info operations
  get_info: z.object({
    apiToken: z.string().describe("DatoCMS API token for authentication. If you are not certain of one, ask for the user, do not hallucinate."),
    environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
  }),

  // Site settings operations
  update_site_settings: z.object({
    apiToken: z.string().describe("DatoCMS API token for authentication. If you are not certain of one, ask for the user, do not hallucinate."),
    settings: z.record(z.any()).describe("Object containing site settings to update. Keys can include 'name', 'locales', 'timezone', etc. Only the fields you want to update need to be included."),
    environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
  })
};

// Create an array of all available project actions for the enum
export const projectActionsList = Object.keys(projectSchemas) as Array<keyof typeof projectSchemas>;
