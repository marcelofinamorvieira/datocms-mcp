import { z } from "zod";

/**
 * Schemas for all webhook-related actions.
 * These schemas define the parameters expected by the webhook tools
 * and are used for validation and documentation.
 *
 * @see https://www.datocms.com/docs/content-management-api/resources/webhook
 */
export const webhookSchemas = {
  list: z.object({
    apiToken: z.string().describe("DatoCMS API token for authentication."),
    environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
  }),

  retrieve: z.object({
    apiToken: z.string().describe("DatoCMS API token for authentication."),
    webhookId: z.string().describe("The ID of the webhook to retrieve."),
    environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
  }),

  create: z.object({
    apiToken: z.string().describe("DatoCMS API token for authentication."),
    name: z.string().describe("A name for the webhook."),
    url: z.string().describe("The URL that will be called when the webhook is triggered."),
    headers: z.record(z.string()).optional().describe("Optional HTTP headers to be sent with the webhook request."),
    events: z.array(z.string()).describe("Array of events that will trigger the webhook (e.g., ['create', 'update', 'publish', 'unpublish'])."),
    payload_format: z.enum(["json", "form"]).optional().describe("The format of the payload: 'json' or 'form'. Default is 'json'."),
    triggers: z.array(z.enum(["item_type", "cache", "uploadable_item"])).optional().describe("Types of resources that will trigger the webhook."),
    httpsOnly: z.boolean().optional().describe("If true, only HTTPS URLs will be accepted."),
    environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
  }),

  update: z.object({
    apiToken: z.string().describe("DatoCMS API token for authentication."),
    webhookId: z.string().describe("The ID of the webhook to update."),
    name: z.string().optional().describe("A new name for the webhook."),
    url: z.string().optional().describe("The new URL that will be called when the webhook is triggered."),
    headers: z.record(z.string()).optional().describe("New HTTP headers to be sent with the webhook request."),
    events: z.array(z.string()).optional().describe("New array of events that will trigger the webhook."),
    payload_format: z.enum(["json", "form"]).optional().describe("The new format of the payload: 'json' or 'form'."),
    triggers: z.array(z.enum(["item_type", "cache", "uploadable_item"])).optional().describe("New types of resources that will trigger the webhook."),
    httpsOnly: z.boolean().optional().describe("If true, only HTTPS URLs will be accepted."),
    environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
  }),

  delete: z.object({
    apiToken: z.string().describe("DatoCMS API token for authentication."),
    webhookId: z.string().describe("The ID of the webhook to delete."),
    environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
  }),
};

/**
 * Schemas for all webhook call log-related actions.
 * These schemas define the parameters expected by the webhook call log tools
 * and are used for validation and documentation.
 * 
 * @see https://www.datocms.com/docs/content-management-api/resources/webhook-call
 */
export const webhookCallSchemas = {
  list: z.object({
    apiToken: z.string().describe("DatoCMS API token for authentication."),
    webhookId: z.string().describe("The ID of the webhook to retrieve call logs for."),
    environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used."),
    filter: z.object({
      status: z.enum(["triggered", "sending", "success", "failure"]).optional().describe("Filter logs by status."),
      itemType: z.string().optional().describe("Filter logs by item type."),
      event: z.string().optional().describe("Filter logs by event type.")
    }).optional().describe("Optional filters to apply to the list of webhook call logs."),
    page: z.object({
      offset: z.number().optional().describe("Pagination offset."),
      limit: z.number().optional().describe("Number of items to return per page.")
    }).optional().describe("Pagination options.")
  }),

  retrieve: z.object({
    apiToken: z.string().describe("DatoCMS API token for authentication."),
    webhookId: z.string().describe("The ID of the webhook that the call belongs to."),
    callId: z.string().describe("The ID of the webhook call to retrieve."),
    environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
  }),

  resend: z.object({
    apiToken: z.string().describe("DatoCMS API token for authentication."),
    webhookId: z.string().describe("The ID of the webhook that the call belongs to."),
    callId: z.string().describe("The ID of the webhook call to resend."),
    environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
  })
};

/**
 * Schemas for all build trigger-related actions.
 * These schemas define the parameters expected by the build trigger tools
 * and are used for validation and documentation.
 * 
 * @see https://www.datocms.com/docs/content-management-api/resources/build-trigger
 */
export const buildTriggerSchemas = {
  list: z.object({
    apiToken: z.string().describe("DatoCMS API token for authentication."),
    environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
  }),

  retrieve: z.object({
    apiToken: z.string().describe("DatoCMS API token for authentication."),
    buildTriggerId: z.string().describe("The ID of the build trigger to retrieve."),
    environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
  }),

  create: z.object({
    apiToken: z.string().describe("DatoCMS API token for authentication."),
    name: z.string().describe("A name for the build trigger."),
    adapter: z.enum(["custom", "netlify", "vercel", "circle_ci", "gitlab", "travis"]).describe("The type of integration to use."),
    adapter_settings: z.record(z.any()).describe("Settings specific to the chosen adapter."),
    indexing_enabled: z.boolean().optional().describe("Whether to enable site search indexing."),
    environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
  }),

  update: z.object({
    apiToken: z.string().describe("DatoCMS API token for authentication."),
    buildTriggerId: z.string().describe("The ID of the build trigger to update."),
    name: z.string().optional().describe("A new name for the build trigger."),
    adapter: z.enum(["custom", "netlify", "vercel", "circle_ci", "gitlab", "travis"]).optional().describe("The type of integration to use."),
    adapter_settings: z.record(z.any()).optional().describe("Settings specific to the chosen adapter."),
    indexing_enabled: z.boolean().optional().describe("Whether to enable site search indexing."),
    environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
  }),

  delete: z.object({
    apiToken: z.string().describe("DatoCMS API token for authentication."),
    buildTriggerId: z.string().describe("The ID of the build trigger to delete."),
    environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
  }),

  trigger: z.object({
    apiToken: z.string().describe("DatoCMS API token for authentication."),
    buildTriggerId: z.string().describe("The ID of the build trigger to execute."),
    environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
  }),

  abort: z.object({
    apiToken: z.string().describe("DatoCMS API token for authentication."),
    buildTriggerId: z.string().describe("The ID of the build trigger to abort."),
    environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
  }),

  abortIndexing: z.object({
    apiToken: z.string().describe("DatoCMS API token for authentication."),
    buildTriggerId: z.string().describe("The ID of the build trigger to abort site search indexing."),
    environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
  }),

  reindex: z.object({
    apiToken: z.string().describe("DatoCMS API token for authentication."),
    buildTriggerId: z.string().describe("The ID of the build trigger to reindex site search."),
    environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
  })
};

/**
 * Schemas for all deploy event-related actions.
 * These schemas define the parameters expected by the deploy event tools
 * and are used for validation and documentation.
 *
 * @see https://www.datocms.com/docs/content-management-api/resources/build-event
 */
export const deployEventSchemas = {
  list: z.object({
    apiToken: z.string().describe("DatoCMS API token for authentication."),
    buildTriggerId: z.string().describe("The ID of the build trigger to retrieve deploy events for."),
    environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used."),
    filter: z.object({
      eventType: z.string().optional().describe("Filter events by event type.")
    }).optional().describe("Optional filters to apply to the list of deploy events."),
    page: z.object({
      offset: z.number().optional().describe("Pagination offset."),
      limit: z.number().optional().describe("Number of items to return per page.")
    }).optional().describe("Pagination options.")
  }),

  retrieve: z.object({
    apiToken: z.string().describe("DatoCMS API token for authentication."),
    buildTriggerId: z.string().describe("The ID of the build trigger that the event belongs to."),
    eventId: z.string().describe("The ID of the deploy event to retrieve."),
    environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
  })
};

// Create arrays of all available actions for the enums
export const webhookActionsList = Object.keys(webhookSchemas) as Array<keyof typeof webhookSchemas>;
export const webhookCallActionsList = Object.keys(webhookCallSchemas) as Array<keyof typeof webhookCallSchemas>;
export const buildTriggerActionsList = Object.keys(buildTriggerSchemas) as Array<keyof typeof buildTriggerSchemas>;
export const deployEventActionsList = Object.keys(deployEventSchemas) as Array<keyof typeof deployEventSchemas>;