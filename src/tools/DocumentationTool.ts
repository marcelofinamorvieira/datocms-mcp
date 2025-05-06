import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { recordsSchemas, recordActionsList } from "./Records/schemas.js";
import { projectSchemas, projectActionsList } from "./Project/schemas.js";
import { createResponse } from "../utils/responseHandlers.js";

// Define schema map for all resources
const schemas = {
  records: recordsSchemas,
  project: projectSchemas
};

type SchemaMap = typeof schemas;

// Create a type-safe action enum for each resource type
type RecordActions = typeof recordActionsList[number];
type ProjectActions = typeof projectActionsList[number];

/**
 * Helper function to extract and format Zod schema into a more user-friendly format
 * This generates documentation that's actually useful to humans
 */
function formatZodSchemaForHumans(schema: z.ZodTypeAny, schemaName: string): object {
  // Check if it's an object schema
  if (schema instanceof z.ZodObject) {
    // Extract shape information
    const shape = schema._def.shape();
    
    // Create a user-friendly representation
    const properties: Record<string, {
      type: string;
      description?: string;
      format?: string;
      enum?: string[];
      properties?: object;
      required: boolean;
      default?: unknown;
    }> = {};
    const required: string[] = [];
    
    // Process each property
    for (const [key, propSchema] of Object.entries(shape)) {
      // Check if property is required
      if (!(propSchema instanceof z.ZodOptional)) {
        required.push(key);
      }
      
      // Unwrap optional schema if needed
      const unwrappedSchema = propSchema instanceof z.ZodOptional 
        ? propSchema._def.innerType 
        : propSchema;
      
      // Extract description if available
      const description = unwrappedSchema._def.description;
      
      // Determine the property type
      let type = "unknown";
      let format: string | undefined = undefined;
      let enumValues: string[] | undefined = undefined;
      let nestedProperties: object | undefined = undefined;
      
      if (unwrappedSchema instanceof z.ZodString) {
        type = "string";
      } else if (unwrappedSchema instanceof z.ZodNumber || unwrappedSchema instanceof z.ZodBigInt) {
        type = "number";
      } else if (unwrappedSchema instanceof z.ZodBoolean) {
        type = "boolean";
      } else if (unwrappedSchema instanceof z.ZodArray) {
        type = "array";
        // Get item type if possible
        const itemType = unwrappedSchema._def.type;
        if (itemType instanceof z.ZodString) {
          format = "string[]";
        } else if (itemType instanceof z.ZodNumber) {
          format = "number[]";
        } else if (itemType instanceof z.ZodObject) {
          format = "object[]";
        }
      } else if (unwrappedSchema instanceof z.ZodEnum) {
        type = "string";
        enumValues = unwrappedSchema._def.values;
        format = "enum";
      } else if (unwrappedSchema instanceof z.ZodObject) {
        type = "object";
        // Recursively format nested object
        nestedProperties = formatZodSchemaForHumans(unwrappedSchema, key);
      } else if (unwrappedSchema instanceof z.ZodRecord) {
        type = "object";
        format = "record";
      }
      
      // Build property information
      properties[key] = {
        type,
        ...(description ? { description } : {}),
        ...(format ? { format } : {}),
        ...(enumValues ? { enum: enumValues } : {}),
        ...(nestedProperties ? { properties: nestedProperties } : {}),
        required: !(propSchema instanceof z.ZodOptional)
      };
      
      // Handle specific schema types and add their descriptions
      if (unwrappedSchema instanceof z.ZodEnum) {
        // Add information about enum values
        properties[key].description = description || `Must be one of: ${unwrappedSchema._def.values.join(', ')}`;
      } else if (unwrappedSchema instanceof z.ZodDefault) {
        // For fields with default values, show the default and the underlying type's description
        const defaultValue = unwrappedSchema._def.defaultValue();
        const innerSchema = unwrappedSchema._def.innerType;
        const innerDescription = innerSchema._def.description;
        
        properties[key].description = innerDescription || description || '';
        properties[key].default = defaultValue;
        
        // Update type based on inner schema
        if (innerSchema instanceof z.ZodBoolean) {
          properties[key].type = "boolean";
        } else if (innerSchema instanceof z.ZodNumber) {
          properties[key].type = "number";
        } else if (innerSchema instanceof z.ZodString) {
          properties[key].type = "string";
        }
        
        if (!properties[key].description && defaultValue !== undefined) {
          properties[key].description = `Default value: ${defaultValue}`;
        }
      }
    }
    
    return {
      name: schemaName,
      type: "object",
      properties,
      required
    };
  }
  
  // Handle non-object schemas (rare case for action schemas)
  return {
    name: schemaName,
    type: "unknown",
    description: "Non-object schema type"
  };
}

/**
 * Registers the Parameters tool with the MCP server. This tool provides essential
 * documentation for DatoCMS API actions and their parameters.
 */
export const registerGetParametersTool = (server: McpServer) => {
  server.tool(
    // Tool name - shorter, clearer, and more action-oriented
    "datocms_parameters",
    // Parameter schema with types
    {
      resource: z.enum(["records", "project"]).describe("The resource type to get parameters for (currently 'records' and 'project' are supported)"),
      action: z.union([
        z.enum(recordActionsList as [RecordActions, ...RecordActions[]]).describe("The specific action you want to perform for records (e.g., 'query', 'get', 'publish', etc.)"),
        z.enum(projectActionsList as [ProjectActions, ...ProjectActions[]]).describe("The specific action you want to perform for project (e.g., 'query', 'get', 'publish', etc.)")
      ])
    },
    // Annotations for the tool - Much stronger emphasis on using this first
    {
      title: "u26a0ufe0f GET PARAMETERS BEFORE EXECUTING u26a0ufe0f",
      description: "YOU MUST USE THIS TOOL FIRST before attempting any DatoCMS operation! After getting the parameters, use the datocms_execute tool with the proper parameters.",
      readOnlyHint: true // This tool is read-only
    },
    // Handler function
    async ({ resource, action }) => {
      // Get the schema map for the specified resource
      const resourceSchemas = schemas[resource as keyof SchemaMap];
      
      if (!resourceSchemas || !(action in resourceSchemas)) {
        return {
          content: [{
            type: "text" as const,
            text: `Documentation not found for resource: ${resource}, action: ${action}. Please check that you're using a valid resource and action combination.`
          }]
        };
      }
      
      // Get the schema for the specified action
      const actionSchema = resourceSchemas[action as keyof typeof resourceSchemas];
      
      // Create a user-friendly representation of the schema
      const schemaDoc = formatZodSchemaForHumans(actionSchema, action) as {
        name: string;
        type: string;
        properties: Record<string, {
          type: string;
          description?: string;
          format?: string;
          enum?: string[];
          properties?: object;
          required: boolean;
          default?: unknown;
        }>;
        required: string[];
      };
      
      // Add a clear usage example to the response - ONLY using ACTUALLY REQUIRED fields
      // and NOT hallucinating fields that don't exist in the schema
      const usageExample: {
        action: string;
        args: Record<string, string>;
      } = {
        action: action,
        args: {}
      };
      
      // Only include required fields in the example
      if (schemaDoc.required && schemaDoc.required.length > 0) {
        for (const requiredField of schemaDoc.required) {
          // Only add if the field actually exists in the properties
          if (schemaDoc.properties[requiredField]) {
            // Add a placeholder that indicates the format rather than a made-up value
            const prop = schemaDoc.properties[requiredField];
            let placeholder = `[YOUR_${requiredField.toUpperCase()}_HERE]`;
            
            // Provide better placeholders based on type
            if (prop.type === "boolean") {
              placeholder = "true or false";
            } else if (prop.format === "enum" && prop.enum) {
              placeholder = `one of: [${prop.enum.join(', ')}]`;
            }
            
            usageExample.args[requiredField] = placeholder;
          }
        }
      }
      
      // Return enhanced documentation with usage example
      return createResponse(JSON.stringify({
        ...schemaDoc,
        usage_example: usageExample,
        important_note: "⚠️ ALWAYS use exactly these parameters with their correct types. Do not add, remove, or modify parameters."
      }, null, 2));
    }
  );
};
