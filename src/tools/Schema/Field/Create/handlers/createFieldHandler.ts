import { createCustomHandler } from "../../../../../utils/enhancedHandlerFactory.js";
import { createResponse, Response as MCPResponse } from "../../../../../utils/responseHandlers.js";
import { UnifiedClientManager } from "../../../../../utils/unifiedClientManager.js";
import { extractDetailedErrorInfo } from "../../../../../utils/errorHandlers.js";
import { schemaSchemas } from "../../../schemas.js";
import type { BaseParams } from "../../../../../utils/enhancedHandlerFactory.js";
import type { Client, SimpleSchemaTypes } from "@datocms/cma-client-node";

interface CreateFieldParams extends BaseParams {
  itemTypeId: string;
  field_type: string;
  label: string;
  apiKey?: string;
  validators?: Record<string, unknown>;
  appearance?: {
    editor: string;
    parameters?: Record<string, unknown>;
    addons?: unknown[];
  };
  [key: string]: unknown; // For additional field properties
}

/**
 * Creates a new field in a DatoCMS item type with improved error handling
 */
export const createFieldHandler = createCustomHandler<CreateFieldParams, MCPResponse>({
  domain: "schema",
  schemaName: "create_field",
  schema: schemaSchemas.create_field,
  errorContext: {
    operation: "create",
    resourceType: "Field",
    handlerName: "createFieldHandler"
  }
}, async (args) => {
  const { apiToken, itemTypeId, environment, field_type, validators, appearance, ...restFieldData } = args;

  // Field-type specific validation
  if (field_type === 'rich_text' && (!validators || !validators.rich_text_blocks)) {
    throw new Error(
      "Missing required validator 'rich_text_blocks' for rich_text field. " +
      "Add { \"rich_text_blocks\": { \"item_types\": [\"block_model_id1\", \"block_model_id2\"] } } to validators."
    );
  }

  if (field_type === 'structured_text' && (!validators || !validators.structured_text_blocks)) {
    throw new Error(
      "Missing required validator 'structured_text_blocks' for structured_text field. " +
      "Add { \"structured_text_blocks\": { \"item_types\": [] } } to validators."
    );
  }

  if (field_type === 'single_block' && (!validators || !validators.single_block_blocks)) {
    throw new Error(
      "Missing required validator 'single_block_blocks' for single_block field. " +
      "Add { \"single_block_blocks\": { \"item_types\": [] } } to validators."
    );
  }
  
  // String field with single_line editor requires heading parameter
  if (
    field_type === 'string' &&
    appearance &&
    appearance.editor === 'single_line'
  ) {
    if (!appearance.parameters) {
      appearance.parameters = { heading: false };
    } else if (appearance.parameters.heading === undefined) {
      appearance.parameters.heading = false;
    }
  }

  // String field with string_radio_group/string_select needs enum validator
  if (
    field_type === 'string' &&
    appearance &&
    (appearance.editor === 'string_radio_group' || appearance.editor === 'string_select') &&
    (!validators || !(validators as { enum?: unknown }).enum)
  ) {
    throw new Error(
      `Missing required validator 'enum' for string field with ${appearance.editor} editor. ` +
        `Add { \"enum\": { \"values\": [...] } } to validators, and ensure values match the options.`
    );
  }

  // Ensure enum validator values match the radio/select options
  if (
    field_type === 'string' &&
    appearance &&
    (appearance.editor === 'string_radio_group' || appearance.editor === 'string_select') &&
    validators &&
    (validators as { enum?: { values?: unknown[] } }).enum &&
    Array.isArray((validators as { enum?: { values?: unknown[] } }).enum?.values)
  ) {
    const optionValues = (
      ((appearance.parameters || {}) as { radios?: Array<{ value: string }>, options?: Array<{ value: string }> }).radios ||
      ((appearance.parameters || {}) as { radios?: Array<{ value: string }>, options?: Array<{ value: string }> }).options ||
      []
    ).map((o) => o.value);
    const enumValues = (validators as { enum: { values: unknown[] } }).enum.values;
    const mismatch =
      optionValues.length !== enumValues.length ||
      optionValues.some((v, idx) => v !== enumValues[idx]);
    if (mismatch) {
      throw new Error(
        "Validator enum values must exactly match the option values in appearance.parameters."
      );
    }
  }
  
  // Link field needs item_item_type validator
  if (field_type === 'link' && (!validators || !validators.item_item_type)) {
    throw new Error(
      "Missing required validator 'item_item_type' for link field. " +
      "Add { \"item_item_type\": { \"item_types\": [\"your_item_type_id\"] } } to validators."
    );
  }

  // Validate item_item_type array
  if (
    field_type === 'link' &&
    (validators as { item_item_type?: { item_types?: unknown[] } })?.item_item_type &&
    (!Array.isArray((validators as { item_item_type?: { item_types?: unknown[] } }).item_item_type?.item_types) ||
      ((validators as { item_item_type?: { item_types?: unknown[] } }).item_item_type?.item_types?.length ?? 0) === 0)
  ) {
    throw new Error(
      "The 'item_item_type' validator must include an 'item_types' array with at least one valid item type ID."
    );
  }

  // Links field needs items_item_type validator
  if (field_type === 'links' && (!validators || !validators.items_item_type)) {
    throw new Error(
      "Missing required validator 'items_item_type' for links field. " +
      "Add { \"items_item_type\": { \"item_types\": [\"your_item_type_id\"] } } to validators."
    );
  }

  // Validate items_item_type array
  if (
    field_type === 'links' &&
    (validators as { items_item_type?: { item_types?: unknown[] } })?.items_item_type &&
    (!Array.isArray((validators as { items_item_type?: { item_types?: unknown[] } }).items_item_type?.item_types) ||
      ((validators as { items_item_type?: { item_types?: unknown[] } }).items_item_type?.item_types?.length ?? 0) === 0)
  ) {
    throw new Error(
      "The 'items_item_type' validator must include an 'item_types' array with at least one valid item type ID."
    );
  }

  // 'required' validator not allowed on some field types
  if (
    validators &&
    (validators as { required?: unknown }).required !== undefined &&
    (field_type === 'gallery' || field_type === 'links' || field_type === 'rich_text')
  ) {
    throw new Error(
      "The 'required' validator is not supported on gallery, links, or rich_text fields. Remove it from the validators object."
    );
  }

  // Ensure addons array is present
  let processedAppearance = appearance;
  if (appearance && !appearance.addons) {
    processedAppearance = {
      ...appearance,
      addons: []
    };
  }

  // Correct editor name for lat_lon field type
  if (field_type === 'lat_lon' && processedAppearance && processedAppearance.editor === 'lat_lon_editor') {
    processedAppearance = {
      ...processedAppearance,
      editor: 'map'
    };
  }

  // Force correct editor and parameters for color fields
  if (field_type === 'color') {
    processedAppearance = {
      editor: 'color_picker',
      parameters: { enable_alpha: false, ...(processedAppearance?.parameters || {}) },
      addons: processedAppearance?.addons || []
    };
  }

  // Provide default parameters for structured text fields
  if (field_type === 'structured_text') {
    processedAppearance = {
      editor: 'structured_text',
      parameters: {
        blocks_start_collapsed: false,
        show_links_target_blank: true,
        show_links_meta_editor: true,
        ...(processedAppearance?.parameters || {})
      },
      addons: processedAppearance?.addons || []
    };
  }

  // Slug fields require slug_title_field validator referencing title field
  if (field_type === 'slug' && (!validators || !(validators as { slug_title_field?: unknown }).slug_title_field)) {
    throw new Error(
      "Missing required validator 'slug_title_field' for slug field. " +
        "Add { \"slug_title_field\": { \"title_field_id\": \"<field_id>\" } } to validators."
    );
  }

  // Build the DatoCMS client
  const client = UnifiedClientManager.getDefaultClient(apiToken, environment) as Client;

  // Prepare field data for the API. The DatoCMS client expects just the
  // attribute object and will automatically wrap it in the JSON:API format.
  const fieldData: Record<string, unknown> = {
    ...restFieldData,
    field_type: field_type,
    validators: validators || {},
    appearance:
      processedAppearance || {
        editor: getDefaultEditor(field_type),
        parameters: {},
        addons: []
      }
  };

  try {
    // Create the field
    const field = await client.fields.create(itemTypeId, fieldData as SimpleSchemaTypes.FieldCreateSchema);

    return createResponse({
      success: true,
      data: field,
      message: `Field '${field.label}' created successfully with ID: ${field.id}`
    });
  } catch (error: unknown) {
    // Enhanced error messages for common issues
    const errorMessage = extractDetailedErrorInfo(error);
    
    if (typeof errorMessage === 'string') {
      if (errorMessage.includes("addons")) {
        throw new Error(
          "The 'addons' field is required in appearance object. " +
          "Always include it, at minimum as an empty array: { \"addons\": [] }"
        );
      }
      
      if (errorMessage.includes("rich_text_blocks")) {
        throw new Error(
          "Rich text fields require the 'rich_text_blocks' validator. " +
          "Example: { \"rich_text_blocks\": { \"item_types\": [\"block_model_id1\", \"block_model_id2\"] } }"
        );
      }

      if (errorMessage.includes("start_collapsed")) {
        throw new Error(
          "The 'start_collapsed' parameter is valid for rich_text and single_block fields. " +
          "For structured_text fields use 'blocks_start_collapsed'. " +
          "Ensure you only include this parameter with the appropriate field types."
        );
      }

      if (errorMessage.includes('item_item_type')) {
        throw new Error(
          "The item type IDs provided in 'item_item_type' are invalid or inaccessible. Verify the IDs and try again."
        );
      }

      if (errorMessage.includes('items_item_type')) {
        throw new Error(
          "The item type IDs provided in 'items_item_type' are invalid or inaccessible. Verify the IDs and try again."
        );
      }

      if (args.field_type === 'color') {
        throw new Error(
          "Error creating color field. Use appearance.editor 'color_picker' and set parameters.enable_alpha to false."
        );
      }
    }

    // Provide more specific guidance
    if (errorMessage.includes("appearance.editor")) {
      if (args.field_type === "lat_lon") {
        throw new Error(
          `Error creating lat_lon field: Make sure you're using "editor": "map" (not "lat_lon_editor") in the appearance. ${errorMessage}`
        );
      } else if (args.field_type === "json") {
        throw new Error(
          `Error creating json field: Make sure you're using one of: "json_editor", "string_multi_select", or "string_checkbox_group" as the editor. ${errorMessage}`
        );
      } else {
        throw new Error(
          `Error with field editor: Invalid editor for field type ${args.field_type}. Check docs/FIELD_CREATION_GUIDE.md for the correct editor names. ${errorMessage}`
        );
      }
    }
    
    // Provide detailed error for field creation errors
    if (errorMessage.includes("INVALID_FORMAT") || errorMessage.includes("INVALID_FIELD")) {
      throw new Error(
        `Error creating field: The field configuration is invalid. 

🔴 COMMON ISSUES AND SOLUTIONS:

1. For string fields with "string_radio_group" or "string_select" appearance:
   REQUIRED: Matching enum validators
   {
     "validators": {
       "enum": {"values": ["option_a", "option_b"]}
     },
     "appearance": {
       "editor": "string_radio_group",
       "parameters": {"radios": [{"label": "Option A", "value": "option_a"}, {"label": "Option B", "value": "option_b"}]},
       "addons": []
     }
   }

2. For location (lat_lon) fields:
   REQUIRED: Use "map" as the editor name
   {
     "field_type": "lat_lon",
     "appearance": {
       "editor": "map",
       "parameters": {},
       "addons": []
     }
   }

3. For text fields:
   REQUIRED: Include empty addons array
   {
     "field_type": "text",
     "appearance": {
       "editor": "textarea",
       "parameters": {"placeholder": "Enter text..."},
       "addons": []
     }
   }

Field Type: ${args.field_type}
Editor: ${args.appearance?.editor || 'not specified'}
Error Details: ${errorMessage}`
      );
    }
    
    throw new Error(`Error creating field: ${errorMessage}`);
  }
});

/**
 * Gets a default editor based on field type
 */
function getDefaultEditor(fieldType: string): string {
  const editorMap: Record<string, string> = {
    string: "single_line",
    text: "textarea",
    rich_text: "rich_text",
    structured_text: "structured_text",
    boolean: "boolean",
    integer: "integer",
    float: "float",
    date: "date_picker",
    date_time: "date_time_picker",
    file: "file",
    gallery: "gallery",
    link: "link_select",
    links: "links_select",
    color: "color_picker",
    json: "json_editor",
    lat_lon: "map",
    seo: "seo",
    video: "video",
    slug: "slug",
    single_block: "framed_single_block"
  };

  return editorMap[fieldType] || "default_editor";
}