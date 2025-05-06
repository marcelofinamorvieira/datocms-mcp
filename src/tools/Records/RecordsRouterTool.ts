import { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { isAuthorizationError, isNotFoundError, createErrorResponse } from "../../utils/errorHandlers.js";
import { createResponse } from "../../utils/responseHandlers.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { returnMostPopulatedLocale } from "../../utils/returnMostPopulatedLocale.js";

// Import the record action schemas and handlers
import { recordsSchemas, recordActionsList } from "./schemas.js";

// Import handlers
import { getRecordByIdHandler } from "./Read/handlers/getRecordByIdHandler.js";
import { getRecordReferencesHandler } from "./Read/handlers/getRecordReferencesHandler.js";
import { queryRecordsHandler } from "./Read/handlers/queryRecordsHandler.js";
import { buildRecordEditorUrlFromTypeHandler } from "./Read/handlers/buildRecordEditorUrlFromTypeHandler.js";
import { duplicateRecordHandler } from "./Create/handlers/duplicateRecordHandler.js";
import { 
  publishRecordHandler,
  unpublishRecordHandler,
  bulkPublishRecordsHandler,
  bulkUnpublishRecordsHandler
} from "./Publication/handlers/index.js";
import { 
  listRecordVersionsHandler,
  getRecordVersionHandler,
  restoreRecordVersionHandler 
} from "./Versions/handlers/index.js";
import { 
  schedulePublicationHandler,
  cancelScheduledPublicationHandler,
  scheduleUnpublicationHandler,
  cancelScheduledUnpublicationHandler
} from "./PublicationScheduling/handlers/index.js";
import {
  destroyRecordHandler,
  bulkDestroyRecordsHandler
} from "./Delete/handlers/index.js";

// Define the types for our action arguments
type ActionArgsMap = {
  query: z.infer<typeof recordsSchemas.query>;
  get: z.infer<typeof recordsSchemas.get>;
  references: z.infer<typeof recordsSchemas.references>;
  editor_url_from_type: z.infer<typeof recordsSchemas.editor_url_from_type>;
  duplicate: z.infer<typeof recordsSchemas.duplicate>;
  destroy: z.infer<typeof recordsSchemas.destroy>;
  bulk_destroy: z.infer<typeof recordsSchemas.bulk_destroy>;
  publish: z.infer<typeof recordsSchemas.publish>;
  bulk_publish: z.infer<typeof recordsSchemas.bulk_publish>;
  unpublish: z.infer<typeof recordsSchemas.unpublish>;
  bulk_unpublish: z.infer<typeof recordsSchemas.bulk_unpublish>;
  schedule_publication: z.infer<typeof recordsSchemas.schedule_publication>;
  cancel_scheduled_publication: z.infer<typeof recordsSchemas.cancel_scheduled_publication>;
  schedule_unpublication: z.infer<typeof recordsSchemas.schedule_unpublication>;
  cancel_scheduled_unpublication: z.infer<typeof recordsSchemas.cancel_scheduled_unpublication>;
  versions_list: z.infer<typeof recordsSchemas.versions_list>;
  version_get: z.infer<typeof recordsSchemas.version_get>;
  version_restore: z.infer<typeof recordsSchemas.version_restore>;
};

// Type for the action parameter
type RecordAction = keyof typeof recordsSchemas;

/**
 * Registers the Records Router tool with the MCP server
 */
export const registerRecordsRouter = (server: McpServer) => {
  const actionEnum = z.enum(recordActionsList as [string, ...string[]]);
  
  server.tool(
    // Tool name
    "datocms_execute",
    // Parameter schema with types using discriminated union based on action
    {
      action: actionEnum,
      args: z.record(z.any()).optional().describe("Arguments for the action to perform. You MUST call datocms_parameters first to know what arguments are required for this action."),
    },
    // Annotations for the tool
    {
      title: "DatoCMS Execute Action",
      description: "Executes a DatoCMS action with the specified parameters. YOU MUST use the 'datocms_parameters' tool FIRST to get the required parameters for each action."
    },
    // Handler function for the records router
    async ({ action, args = {} }) => {
      try {
        // ALWAYS CHECK FOR PARAMETERS FIRST
        // If there are no arguments, or very few args for non-trivial operations,
        // redirect users to get_parameters first
        const shouldSuggestParams = (
          // These conditions indicate the user is likely not providing proper parameters
          Object.keys(args).length === 0 || 
          (Object.keys(args).length < 3 && ['query', 'create', 'update', 'bulk_publish', 'bulk_destroy'].includes(action))
        );
        
        if (shouldSuggestParams) {
          return createErrorResponse(`⚠️ PARAMETERS REQUIRED: You need to specify the parameters for the '${action}' action. ⚠️

To get the required parameters, use the datocms_parameters tool first with:
{
  "resource": "records",
  "action": "${action}"
}

This will show you all the required parameters and their types.`);
        }
        
        // Get the schema for the action
        const validAction = action as RecordAction;
        const actionSchema = recordsSchemas[validAction];
        if (!actionSchema) {
          return createErrorResponse(`Error: Unsupported action '${action}'. Valid actions are: ${recordActionsList.join(', ')}`);
        }
        
        // Validate arguments against the schema
        try {
          const validatedArgs = actionSchema.parse(args);
          
          // Route to the appropriate handler based on the action
          switch (validAction) {
            case "query":
              return queryRecordsHandler(validatedArgs as ActionArgsMap['query']);
            case "get":
              return getRecordByIdHandler(validatedArgs as ActionArgsMap['get']);
            case "references":
              return getRecordReferencesHandler(validatedArgs as ActionArgsMap['references']);
            case "editor_url_from_type":
              return buildRecordEditorUrlFromTypeHandler(validatedArgs as ActionArgsMap['editor_url_from_type']);
            case "duplicate":
              return duplicateRecordHandler(validatedArgs as ActionArgsMap['duplicate']);
            case "destroy":
              return destroyRecordHandler(validatedArgs as ActionArgsMap['destroy']);
            case "bulk_destroy":
              return bulkDestroyRecordsHandler(validatedArgs as ActionArgsMap['bulk_destroy']);
            case "publish":
              return publishRecordHandler(validatedArgs as ActionArgsMap['publish']);
            case "bulk_publish":
              return bulkPublishRecordsHandler(validatedArgs as ActionArgsMap['bulk_publish']);
            case "unpublish":
              return unpublishRecordHandler(validatedArgs as ActionArgsMap['unpublish']);
            case "bulk_unpublish":
              return bulkUnpublishRecordsHandler(validatedArgs as ActionArgsMap['bulk_unpublish']);
            case "schedule_publication":
              return schedulePublicationHandler(validatedArgs as ActionArgsMap['schedule_publication']);
            case "cancel_scheduled_publication":
              return cancelScheduledPublicationHandler(validatedArgs as ActionArgsMap['cancel_scheduled_publication']);
            case "schedule_unpublication":
              return scheduleUnpublicationHandler(validatedArgs as ActionArgsMap['schedule_unpublication']);
            case "cancel_scheduled_unpublication":
              return cancelScheduledUnpublicationHandler(validatedArgs as ActionArgsMap['cancel_scheduled_unpublication']);
            case "versions_list":
              return listRecordVersionsHandler(validatedArgs as ActionArgsMap['versions_list']);
            case "version_get":
              return getRecordVersionHandler(validatedArgs as ActionArgsMap['version_get']);
            case "version_restore":
              return restoreRecordVersionHandler(validatedArgs as ActionArgsMap['version_restore']);
            default: {
              // This is a type check to ensure we've handled all possible actions
              const _exhaustiveCheck: never = validAction;
              return createErrorResponse(`Error: Unsupported action '${action}'. This is likely a bug.`);
            }
          }
        } catch (error) {
          if (error instanceof z.ZodError) {
            // Get the schema for documentation purposes
            const schemaInfo = formatSchemaForDisplay(actionSchema);
            
            // Format the validation error in a helpful way
            const errorFormatted = formatZodError(error);
            
            return createErrorResponse(`⚠️ VALIDATION ERROR: Your parameters for '${action}' are incorrect or incomplete! ⚠️

${errorFormatted}

REQUIRED PARAMETERS FOR '${action.toUpperCase()}' ACTION:
${JSON.stringify(schemaInfo, null, 2)}

To see proper documentation, use the 'datocms_parameters' tool first with:\n\n  action: "datocms_parameters",\n  args: {\n    resource: "records",\n    action: "${action}"\n  }`);
          }
          return createErrorResponse(`Error validating arguments: ${error instanceof Error ? error.message : String(error)}`);
        }
      } catch (error: unknown) {
        return createErrorResponse(`Error in Records Router: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );
};

// Only destructor method needs to remain
/**
 * Helper function to clean up and release resources when the MCP server is shut down
 */
export function destroy() {
  // Clean up code here if needed
}

// Helper function to format schema for display
function formatSchemaForDisplay(schema: z.ZodSchema) {
  // Extract structure and metadata from the schema
  const description = schema.description || "No description available";
  
  // Try to extract basic information about the schema
  try {
    // @ts-expect-error - Zod's type definitions are not consistent across versions
    const schemaDescription = schema.describe();
    
    // Add a note to use the get_parameters tool
    return {
      ...schemaDescription,
      note: "For more detailed parameter information, use the 'datocms_parameters' tool"
    };
  } catch (error) {
    // Fallback if the schema doesn't support describe()
    return {
      type: "object",
      description,
      note: "Schema details unavailable. Use the 'datocms_parameters' tool for parameter information."
    };
  }
}

// Helper function to format ZodError for display
function formatZodError(error: z.ZodError) {
  return error.issues.map(issue => `- ${issue.path.join('.')}: ${issue.message}`).join('\n');
}
