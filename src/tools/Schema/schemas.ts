import { z } from "zod";

/**
 * Schemas for all schema-related actions (Item Types, Fieldsets, and Fields)
 * These schemas are used for both the schema router and describe tools.
 */
export const schemaSchemas = {
  // ItemType operations
  create_item_type: z.object({
    apiToken: z.string().describe("DatoCMS API token for authentication."),
    name: z.string().describe("The name of the new Item Type (model)."),
    apiKey: z.string().describe("The API key to identify the item type (API-safe identifier)."),
    allLocalesRequired: z.boolean().optional().describe("Whether the item type requires content to be provided for all locales."),
    draftModeActive: z.boolean().optional().describe("Whether draft mode is active for this item type."),
    modularBlock: z.boolean().optional().describe("Whether the item type is a modular block."),
    orderingDirection: z.enum(["asc", "desc"]).optional().describe("The direction of the ordering."),
    orderingField: z.string().optional().describe("The field to use for ordering."),
    singleton: z.boolean().optional().describe("Whether the item type is a singleton."),
    sortable: z.boolean().optional().describe("Whether the item type is sortable."),
    titleField: z.string().optional().describe("The field to use as the title."),
    tree: z.boolean().optional().describe("Whether the item type is structured as a tree."),
    environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
  }),

  duplicate_item_type: z.object({
    apiToken: z.string().describe("DatoCMS API token for authentication."),
    itemTypeId: z.string().describe("The ID of the item type to duplicate."),
    name: z.string().describe("The name for the duplicated item type."),
    apiKey: z.string().describe("The API key for the duplicated item type (must be unique)."),
    environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
  }),

  get_item_type: z.object({
    apiToken: z.string().describe("DatoCMS API token for authentication."),
    itemTypeId: z.string().describe("The ID of the item type to retrieve."),
    environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
  }),

  list_item_types: z.object({
    apiToken: z.string().describe("DatoCMS API token for authentication."),
    environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used."),
    page: z.object({
      offset: z.number().int().optional().default(0).describe("The (zero-based) offset of the first entity returned in the collection (defaults to 0)."),
      limit: z.number().int().optional().default(10).describe("The maximum number of entities to return (defaults to 10, maximum is 500).")
    }).optional().describe("Parameters to control offset-based pagination.")
  }),

  update_item_type: z.object({
    apiToken: z.string().describe("DatoCMS API token for authentication."),
    itemTypeId: z.string().describe("The ID of the item type to update."),
    name: z.string().optional().describe("The updated name of the item type."),
    apiKey: z.string().optional().describe("The updated API key for the item type."),
    allLocalesRequired: z.boolean().optional().describe("Whether the item type requires content to be provided for all locales."),
    draftModeActive: z.boolean().optional().describe("Whether draft mode is active for this item type."),
    modularBlock: z.boolean().optional().describe("Whether the item type is a modular block."),
    orderingDirection: z.enum(["asc", "desc"]).optional().describe("The direction of the ordering."),
    orderingField: z.string().optional().describe("The field to use for ordering."),
    singleton: z.boolean().optional().describe("Whether the item type is a singleton."),
    sortable: z.boolean().optional().describe("Whether the item type is sortable."),
    titleField: z.string().optional().describe("The field to use as the title."),
    tree: z.boolean().optional().describe("Whether the item type is structured as a tree."),
    environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
  }),

  delete_item_type: z.object({
    apiToken: z.string().describe("DatoCMS API token for authentication."),
    itemTypeId: z.string().describe("The ID of the item type to delete."),
    confirmation: z.boolean().describe("Explicit confirmation that you want to delete this item type. This is a destructive action that cannot be undone."),
    environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
  }),

  // Fieldset operations
  create_fieldset: z.object({
    apiToken: z.string().describe("DatoCMS API token for authentication."),
    itemTypeId: z.string().describe("ID of the item type to which this fieldset belongs."),
    title: z.string().describe("The name of the fieldset."),
    hint: z.string().nullable().optional().describe("Additional hint text for the fieldset."),
    position: z.number().int().optional().describe("Position index for ordering fieldsets."),
    collapsible: z.boolean().optional().default(false).describe("Whether the fieldset can be collapsed."),
    start_collapsed: z.boolean().optional().default(false).describe("Whether the fieldset should be initially collapsed."),
    environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
  }),

  update_fieldset: z.object({
    apiToken: z.string().describe("DatoCMS API token for authentication."),
    fieldsetId: z.string().describe("The ID of the fieldset to update."),
    title: z.string().optional().describe("The updated name of the fieldset."),
    hint: z.string().nullable().optional().describe("Updated additional hint text for the fieldset."),
    position: z.number().int().optional().describe("Updated position index for ordering fieldsets."),
    collapsible: z.boolean().optional().describe("Whether the fieldset can be collapsed."),
    start_collapsed: z.boolean().optional().describe("Whether the fieldset should be initially collapsed."),
    environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
  }),

  list_fieldsets: z.object({
    apiToken: z.string().describe("DatoCMS API token for authentication."),
    itemTypeId: z.string().describe("ID of the item type to filter fieldsets by. This is required by the DatoCMS API."),
    page: z.object({
      offset: z.number().int().optional().default(0).describe("The (zero-based) offset of the first entity returned in the collection (defaults to 0)."),
      limit: z.number().int().optional().default(10).describe("The maximum number of entities to return (defaults to 10, maximum is 500).")
    }).optional().describe("Parameters to control offset-based pagination."),
    environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
  }),

  get_fieldset: z.object({
    apiToken: z.string().describe("DatoCMS API token for authentication."),
    fieldsetId: z.string().describe("The ID of the fieldset to retrieve."),
    environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
  }),

  delete_fieldset: z.object({
    apiToken: z.string().describe("DatoCMS API token for authentication."),
    fieldsetId: z.string().describe("The ID of the fieldset to delete."),
    confirmation: z.boolean().describe("Explicit confirmation that you want to delete this fieldset. This is a destructive action that cannot be undone."),
    environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
  }),

  // Field operations
  create_field: z.object({
    apiToken: z.string().describe("DatoCMS API token for authentication."),
    itemTypeId: z.string().describe("ID of the item type to which this field belongs."),
    label: z.string().describe("The human-readable name of the field."),
    api_key: z.string().describe("The API key to identify the field (API-safe identifier)."),
    field_type: z.enum([
      'boolean', 'color', 'date', 'date_time', 'file', 'float',
      'gallery', 'integer', 'json', 'lat_lon', 'link', 'links',
      'rich_text', 'seo', 'single_block', 'slug', 'string',
      'structured_text', 'text', 'video'
    ]).describe("The type of the field."),
    validators: z.record(z.unknown()).optional().describe("Validators for the field (structure depends on field_type)."),
    appearance: z.object({
      editor: z.string(),
      parameters: z.record(z.unknown()),
      addons: z.array(z.object({
        id: z.string(),
        field_extension: z.string().optional(),
        parameters: z.record(z.unknown())
      })).optional()
    }).optional().describe("Appearance options for the field (structure depends on field_type)."),
    position: z.number().int().optional().describe("Position index for ordering fields."),
    hint: z.string().nullable().optional().describe("Additional hint text for the field."),
    localized: z.boolean().optional().describe("Whether the field is localized (translatable)."),
    fieldset_id: z.string().optional().describe("The ID of the fieldset to assign the field to."),
    environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
  }),

  update_field: z.object({
    apiToken: z.string().describe("DatoCMS API token for authentication."),
    fieldId: z.string().describe("The ID of the field to update."),
    label: z.string().optional().describe("The updated human-readable name of the field."),
    api_key: z.string().optional().describe("The updated API key to identify the field."),
    field_type: z.enum([
      'boolean', 'color', 'date', 'date_time', 'file', 'float',
      'gallery', 'integer', 'json', 'lat_lon', 'link', 'links',
      'rich_text', 'seo', 'single_block', 'slug', 'string',
      'structured_text', 'text', 'video'
    ]).optional().describe("The updated type of the field."),
    validators: z.record(z.unknown()).optional().describe("Updated validators for the field."),
    appearance: z.object({
      editor: z.string(),
      parameters: z.record(z.unknown()),
      addons: z.array(z.object({
        id: z.string(),
        field_extension: z.string().optional(),
        parameters: z.record(z.unknown())
      })).optional()
    }).optional().describe("Updated appearance options for the field."),
    position: z.number().int().optional().describe("Updated position index for ordering fields."),
    hint: z.string().nullable().optional().describe("Updated additional hint text for the field."),
    localized: z.boolean().optional().describe("Whether the field is localized (translatable)."),
    fieldset_id: z.string().optional().describe("The updated ID of the fieldset to assign the field to."),
    environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
  }),

  get_field: z.object({
    apiToken: z.string().describe("DatoCMS API token for authentication."),
    fieldId: z.string().describe("The ID of the field to retrieve."),
    environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
  }),

  list_fields: z.object({
    apiToken: z.string().describe("DatoCMS API token for authentication."),
    itemTypeId: z.string().describe("ID of the item type to filter fields by."),
    page: z.object({
      offset: z.number().int().optional().default(0).describe("The (zero-based) offset of the first entity returned in the collection (defaults to 0)."),
      limit: z.number().int().optional().default(10).describe("The maximum number of entities to return (defaults to 10, maximum is 500).")
    }).optional().describe("Parameters to control offset-based pagination."),
    environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
  }),

  delete_field: z.object({
    apiToken: z.string().describe("DatoCMS API token for authentication."),
    fieldId: z.string().describe("The ID of the field to delete."),
    confirmation: z.boolean().describe("Explicit confirmation that you want to delete this field. This is a destructive action that cannot be undone."),
    environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
  })
};

// Create an array of all available schema actions for the enum
export const schemaActionsList = Object.keys(schemaSchemas) as Array<keyof typeof schemaSchemas>;