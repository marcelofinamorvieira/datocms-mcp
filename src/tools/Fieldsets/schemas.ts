import { z } from "zod";

/**
 * Schemas for all fieldset-related actions.
 * These schemas are used for both the fieldset router and describe tools.
 */
export const fieldsetSchemas = {
  // Create operation
  create: z.object({
    apiToken: z.string().describe("DatoCMS API token for authentication."),
    itemTypeId: z.string().describe("ID of the item type to which this fieldset belongs."),
    title: z.string().describe("The name of the fieldset."),
    hint: z.string().nullable().optional().describe("Additional hint text for the fieldset."),
    position: z.number().int().optional().describe("Position index for ordering fieldsets."),
    collapsible: z.boolean().optional().default(false).describe("Whether the fieldset can be collapsed."),
    start_collapsed: z.boolean().optional().default(false).describe("Whether the fieldset should be initially collapsed."),
    environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
  }),

  // Update operation
  update: z.object({
    apiToken: z.string().describe("DatoCMS API token for authentication."),
    fieldsetId: z.string().describe("The ID of the fieldset to update."),
    title: z.string().optional().describe("The updated name of the fieldset."),
    hint: z.string().nullable().optional().describe("Updated additional hint text for the fieldset."),
    position: z.number().int().optional().describe("Updated position index for ordering fieldsets."),
    collapsible: z.boolean().optional().describe("Whether the fieldset can be collapsed."),
    start_collapsed: z.boolean().optional().describe("Whether the fieldset should be initially collapsed."),
    environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
  }),

  // List operation
  list: z.object({
    apiToken: z.string().describe("DatoCMS API token for authentication."),
    itemTypeId: z.string().describe("ID of the item type to filter fieldsets by. This is required by the DatoCMS API."),
    page: z.object({
      offset: z.number().int().optional().default(0).describe("The (zero-based) offset of the first entity returned in the collection (defaults to 0)."),
      limit: z.number().int().optional().default(10).describe("The maximum number of entities to return (defaults to 10, maximum is 500).")
    }).optional().describe("Parameters to control offset-based pagination."),
    environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
  }),

  // Retrieve operation
  get: z.object({
    apiToken: z.string().describe("DatoCMS API token for authentication."),
    fieldsetId: z.string().describe("The ID of the fieldset to retrieve."),
    environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
  }),

  // Delete operation
  destroy: z.object({
    apiToken: z.string().describe("DatoCMS API token for authentication."),
    fieldsetId: z.string().describe("The ID of the fieldset to delete."),
    confirmation: z.boolean().describe("Explicit confirmation that you want to delete this fieldset. This is a destructive action that cannot be undone."),
    environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
  })
};

// Create an array of all available fieldset actions for the enum
export const fieldsetActionsList = Object.keys(fieldsetSchemas) as Array<keyof typeof fieldsetSchemas>;