import { z } from "zod";

/**
 * Schemas for all record-related actions.
 * These schemas are extracted from the original record tool definitions
 * and are used for both the records router and describe tools.
 */
export const recordsSchemas = {
  // Read operations
  query: z.object({
    apiToken: z.string().describe("DatoCMS API token for authentication. If you are not certain of one, ask for the user, do not halucinate."),
    textSearch: z.string().optional().describe("SIMPLE TEXT SEARCH ONLY. Enter ONLY the raw search term (like 'searchTerm') with NO additional syntax. NOT a GraphQL query. NOT a filter. ONLY the exact word or phrase you want to find across all records. Examples: 'potato', 'dog', 'content management'."),
    ids: z.string().optional().describe("Comma-separated list of DatoCMS record IDs to fetch (with no spaces), e.g.: 'abc123,def456'. Records can be from different models."),
    modelId: z.string().optional().describe("Model ID to restrict results to"),
    modelName: z.string().optional().describe("Model name to restrict results to"),
    fields: z.record(z.record(z.any())).optional().describe("Filter records by field values within a model. Only use this when the user specifically asks to filter by a particular field. Requires modelId or modelName. Object where keys are field API names and values are filter conditions. Example: { name: { in: ['Buddy', 'Rex'] }, breed: { eq: 'mixed' } }. See DatoCMS filtering documentation https://www.datocms.com/docs/content-delivery-api/filtering-records for all available operators: eq, neq, matches, in, nin, gt, gte, lt, lte, exists."),
    locale: z.string().optional().describe("Optional locale to use when filtering by localized fields. If not specified, environment's main locale will be used."),
    order_by: z.string().optional().describe("Fields used to order results. Format: <field_name>_(ASC|DESC), where <field_name> can be a model's field API key or meta columns like id, _updated_at, _created_at, etc. You can pass multiple comma-separated rules (e.g., 'name_DESC,_created_at_ASC'). Requires modelId or modelName to be specified."),
    version: z.enum(["published", "current"]).optional().default("current").describe("Whether to retrieve the published version ('published') or the latest draft ('current'). Default is 'current'."),
    returnAllLocales: z.boolean().optional().default(false).describe("If true, returns all locale versions for each field instead of only the most populated locale. Default is false to save on token usage."),
    returnOnlyIds: z.boolean().optional().default(false).describe("If true, returns only an array of record IDs instead of complete records. Use this to save on tokens and context window space when only IDs are needed. These IDs can then be used with GetDatoCMSRecordById to get detailed information. Default is false."),
    page: z.object({
      offset: z.number().int().optional().default(0).describe("The (zero-based) offset of the first entity returned in the collection (defaults to 0)."),
      limit: z.number().int().optional().default(5).describe("The maximum number of entities to return (defaults to 5, maximum is 500).")
    }).optional().describe("Parameters to control offset-based pagination."),
    nested: z.boolean().optional().default(true).describe("For Modular Content, Structured Text and Single Block fields. If set to true, returns full payload for nested blocks instead of just their IDs. Default is true."),
    environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
  }),

  get: z.object({ 
    apiToken: z.string().describe("DatoCMS API token for authentication. If you are not certain of one, ask for the user, do not halucinate."),
    itemId: z.string().describe("The ID of the specific DatoCMS record to retrieve."),
    version: z.enum(["published", "current"]).optional().describe("Whether to retrieve the published version ('published') or the latest draft ('current'). Default is 'published'."),
    returnAllLocales: z.boolean().optional().describe("If true, returns all locale versions for each field instead of only the most populated locale. Default is false to save on token usage."),
    nested: z.boolean().optional().describe("For Modular Content, Structured Text and Single Block fields. If set to true, returns full payload for nested blocks instead of just their IDs. Default is true."),
    environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
  }),

  references: z.object({ 
    apiToken: z.string().describe("DatoCMS API token for authentication."),
    itemId: z.string().describe("The ID of the DatoCMS record to get references for."),
    version: z.enum(["published", "current"]).optional().describe("Whether to retrieve the published version ('published') or the latest draft ('current'). Default is 'current'."),
    returnAllLocales: z.boolean().optional().describe("If true, returns all locale versions for each field instead of only the most populated locale. Default is false to save on token usage."),
    nested: z.boolean().optional().describe("For Modular Content, Structured Text and Single Block fields. If set to true, returns full payload for nested blocks instead of just their IDs. Default is true."),
    returnOnlyIds: z.boolean().optional().default(true).describe("If true, returns only an array of record IDs instead of complete records. Use this to save on tokens and context window space when only IDs are needed. These IDs can then be used with GetDatoCMSRecordById to get detailed information. Default is false."),
    environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
  }),

  editor_url_from_type: z.object({ 
    projectUrl: z.string().describe("DatoCMS project URL. If the user did not provide one yet, use the datocms_project tool with action 'get_info' to retrieve it. The URL will be under the internal_domain property."),
    itemTypeId: z.string().describe("The item type ID from DatoCMS, typically available in the item.item_type.id property of a record."),
    itemId: z.string().describe("The ID of the specific record you want to build a URL for."),
    environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
  }),

  // Create operations
  duplicate: z.object({ 
    apiToken: z.string().describe("DatoCMS API token for authentication."),
    itemId: z.string().describe("The ID of the DatoCMS record to duplicate."),
    returnOnlyConfirmation: z.boolean().optional().describe("If true, returns only a success confirmation message instead of the full record data. Use this to save on token usage. Default is false."),
    environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
  }),

  // Delete operations
  destroy: z.object({ 
    apiToken: z.string().describe("DatoCMS API token for authentication."),
    itemId: z.string().describe("The ID of the DatoCMS record to destroy."),
    confirmation: z.boolean().describe("Explicit confirmation that you want to delete this record. This is a destructive action that cannot be undone."),
    returnOnlyConfirmation: z.boolean().optional().describe("If true, returns only a success confirmation message instead of the full record data. Use this to save on token usage. Default is false."),
    environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
  }),

  bulk_destroy: z.object({ 
    apiToken: z.string().describe("DatoCMS API token for authentication."),
    itemIds: z.array(z.string()).describe("Array of record IDs to destroy."),
    confirmation: z.boolean().describe("Explicit confirmation that you want to delete these records. This is a destructive action that cannot be undone."),
    environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
  }),

  // Publication operations
  publish: z.object({ 
    apiToken: z.string().describe("DatoCMS API token for authentication."),
    itemId: z.string().describe("The ID of the DatoCMS record to publish."),
    content_in_locales: z.array(z.string()).optional().describe("Optional array of locale codes to publish. If not provided, all locales will be published. If provided, non_localized_content must be provided as well."),
    non_localized_content: z.boolean().optional().describe("Whether non-localized content will be published. If not provided and content_in_locales is missing, all content will be published. If provided, content_in_locales must be provided as well."),
    recursive: z.boolean().optional().default(false).describe("When true, if the record belongs to a tree-like collection and any parent records aren't published, those parent records will be published as well. When false, an UNPUBLISHED_PARENT error will occur in such cases."),
    environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
  }),

  bulk_publish: z.object({ 
    apiToken: z.string().describe("DatoCMS API token for authentication."),
    itemIds: z.array(z.string()).describe("Array of record IDs to publish."),
    content_in_locales: z.array(z.string()).optional().describe("Optional array of locale codes to publish. If not provided, all locales will be published. If provided, non_localized_content must be provided as well."),
    non_localized_content: z.boolean().optional().describe("Whether non-localized content will be published. If not provided and content_in_locales is missing, all content will be published. If provided, content_in_locales must be provided as well."),
    recursive: z.boolean().optional().default(false).describe("When true, if the record belongs to a tree-like collection and any parent records aren't published, those parent records will be published as well. When false, an UNPUBLISHED_PARENT error will occur in such cases."),
    environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
  }),

  unpublish: z.object({ 
    apiToken: z.string().describe("DatoCMS API token for authentication."),
    itemId: z.string().describe("The ID of the DatoCMS record to unpublish."),
    recursive: z.boolean().optional().default(false).describe("When true, if the record belongs to a tree-like collection and any child records are published, those child records will be unpublished as well. When false, a PUBLISHED_CHILDREN error will occur in such cases."),
    environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
  }),

  bulk_unpublish: z.object({ 
    apiToken: z.string().describe("DatoCMS API token for authentication."),
    itemIds: z.array(z.string()).describe("Array of record IDs to unpublish."),
    recursive: z.boolean().optional().default(false).describe("When true, if the record belongs to a tree-like collection and any child records are published, those child records will be unpublished as well. When false, a PUBLISHED_CHILDREN error will occur in such cases."),
    environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
  }),

  // Publication scheduling operations
  schedule_publication: z.object({ 
    apiToken: z.string().describe("DatoCMS API token for authentication."),
    itemId: z.string().describe("The ID of the DatoCMS record to schedule publication for."),
    publication_scheduled_at: z.string().describe("The ISO8601 timestamp when the record should be automatically published (e.g., '2023-12-31T23:59:59Z')."),
    environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
  }),

  cancel_scheduled_publication: z.object({ 
    apiToken: z.string().describe("DatoCMS API token for authentication."),
    itemId: z.string().describe("The ID of the DatoCMS record to cancel scheduled publication for."),
    environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
  }),

  schedule_unpublication: z.object({ 
    apiToken: z.string().describe("DatoCMS API token for authentication."),
    itemId: z.string().describe("The ID of the DatoCMS record to schedule unpublication for."),
    unpublishing_scheduled_at: z.string().describe("The ISO8601 timestamp when the record should be automatically unpublished (e.g., '2023-12-31T23:59:59Z')."),
    environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
  }),

  cancel_scheduled_unpublication: z.object({ 
    apiToken: z.string().describe("DatoCMS API token for authentication."),
    itemId: z.string().describe("The ID of the DatoCMS record to cancel scheduled unpublication for."),
    environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
  }),

  // Version operations
  versions_list: z.object({ 
    apiToken: z.string().describe("DatoCMS API token for authentication."),
    itemId: z.string().describe("The ID of the DatoCMS record to retrieve versions for."),
    returnOnlyIds: z.boolean().optional().default(true).describe("If true, returns only an array of version IDs and their timestamps instead of complete version records. This saves on token usage and response size. Default is true."),
    page: z.object({
      limit: z.number().int().optional().default(5).describe("Maximum number of versions to return per page (defaults to 25, maximum is 500)."),
      offset: z.number().int().optional().default(0).describe("The (zero-based) offset of the first version returned in the collection (defaults to 0).")
    }).optional().describe("Parameters to control offset-based pagination."),
    environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
  }),

  version_get: z.object({ 
    apiToken: z.string().describe("DatoCMS API token for authentication."),
    itemId: z.string().describe("The ID of the DatoCMS record."),
    versionId: z.string().describe("The ID of the version to retrieve."),
    environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
  }),

  version_restore: z.object({ 
    apiToken: z.string().describe("DatoCMS API token for authentication."),
    itemId: z.string().describe("The ID of the DatoCMS record."),
    versionId: z.string().describe("The ID of the version to restore."),
    environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
  })
};

// Create an array of all available record actions for the enum
export const recordActionsList = Object.keys(recordsSchemas) as Array<keyof typeof recordsSchemas>;
