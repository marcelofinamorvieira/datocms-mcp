import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  uploadsSchemas,
  uploadsActionsList
} from "./schemas.js";
import { createErrorResponse } from "../../utils/errorHandlers.js";
import { createResponse } from "../../utils/responseHandlers.js";

// Handler imports
import { getUploadByIdHandler } from "./Read/handlers/getUploadByIdHandler.js";
import { queryUploadsHandler } from "./Read/handlers/queryUploadsHandler.js";
import { getUploadReferencesHandler } from "./Read/handlers/getUploadReferencesHandler.js";
import { createUploadHandler } from "./Create/handlers/createUploadHandler.js";
import { updateUploadHandler } from "./Update/handlers/updateUploadHandler.js";
import { destroyUploadHandler } from "./Delete/handlers/destroyUploadHandler.js";
import { bulkDestroyUploadsHandler } from "./Delete/handlers/bulkDestroyUploadsHandler.js";
import { bulkTagUploadsHandler } from "./Update/handlers/bulkTagUploadsHandler.js";
import { bulkSetUploadCollectionHandler } from "./Update/handlers/bulkSetUploadCollectionHandler.js";
/* Tags */
import { listUploadTagsHandler } from "./Tags/handlers/listUploadTagsHandler.js";
import { createUploadTagHandler } from "./Tags/handlers/createUploadTagHandler.js";
import { listUploadSmartTagsHandler } from "./Tags/handlers/listUploadSmartTagsHandler.js";
/* Collections */
import { getUploadCollectionHandler } from "./UploadCollections/handlers/getUploadCollectionHandler.js";
import { queryUploadCollectionsHandler } from "./UploadCollections/handlers/queryUploadCollectionsHandler.js";
import { createUploadCollectionHandler } from "./UploadCollections/handlers/createUploadCollectionHandler.js";
import { updateUploadCollectionHandler } from "./UploadCollections/handlers/updateUploadCollectionHandler.js";
import { deleteUploadCollectionHandler } from "./UploadCollections/handlers/deleteUploadCollectionHandler.js";
// More handlers (references, create, update, etc.) will be wired in Part 2.

type UploadAction = keyof typeof uploadsSchemas;

export const registerUploadsRouter = (server: McpServer) => {
  const actionEnum = z.enum(uploadsActionsList as [string, ...string[]]);

  server.tool(
    "datocms_uploads",
    {
      action: actionEnum,
      args: z.record(z.any()).optional().describe(
        "Parameters for the specific uploads action. " +
        "Always call 'datocms_parameters' first to discover the required args."
      )
    },
    {
      title: "DatoCMS Uploads Operations",
      description:
        "Unified router for all DatoCMS uploads endpoints. " +
        "Call the documentation tool first to see each action's parameters."
    },
    async ({ action, args = {} }) => {
      // Suggest documentation if no args
      if (Object.keys(args).length === 0) {
        return createErrorResponse(
          `⚠️ PARAMETERS REQUIRED for '${action}'.\n` +
          `Use 'datocms_parameters' with { resource:\"uploads\", action:\"${action}\" } first.`
        );
      }

      const schema = uploadsSchemas[action as UploadAction];
      let validated: any;
      try {
        validated = schema.parse(args);
      } catch (e) {
        if (e instanceof z.ZodError) {
          return createErrorResponse(
            `Validation error: ${e.issues.map(i => i.message).join("; ")}`
          );
        }
        throw e;
      }

      switch (action as UploadAction) {
        case "get":
          return getUploadByIdHandler(validated);
        case "query":
          return queryUploadsHandler(validated);
        case "references":
          return getUploadReferencesHandler(validated);
        case "create":
          return createUploadHandler(validated);
        case "update":
          return updateUploadHandler(validated);
        case "destroy":
          return destroyUploadHandler(validated);
        case "bulk_destroy":
          return bulkDestroyUploadsHandler(validated);
        case "bulk_tag":
          return bulkTagUploadsHandler(validated);
        case "bulk_set_collection":
          return bulkSetUploadCollectionHandler(validated);

        /* Tags */
        case "list_tags":
          return listUploadTagsHandler(validated);
        case "create_tag":
          return createUploadTagHandler(validated);
        case "list_smart_tags":
          return listUploadSmartTagsHandler(validated);

        /* Collections */
        case "get_collection":
          return getUploadCollectionHandler(validated);
        case "query_collections":
          return queryUploadCollectionsHandler(validated);
        case "create_collection":
          return createUploadCollectionHandler(validated);
        case "update_collection":
          return updateUploadCollectionHandler(validated);
        case "delete_collection":
          return deleteUploadCollectionHandler(validated);

        default:
          return createResponse(
            `Action '${action}' is not yet implemented in the router.`
          );
      }
    }
  );
};