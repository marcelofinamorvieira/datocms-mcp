import type { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import {
  isAuthorizationError,
  createErrorResponse
} from "../../../../utils/errorHandlers.js";
import { createResponse } from "../../../../utils/responseHandlers.js";
import { uploadsSchemas } from "../../schemas.js";

export const queryUploadCollectionsHandler = async (
  args: z.infer<typeof uploadsSchemas.query_collections>
) => {
  const { apiToken, ids, environment } = args;
  try {
    const client = buildClient(environment ? { apiToken, environment } : { apiToken });
    const opts = ids
      ? { filter: { ids: Array.isArray(ids) ? ids.join(",") : ids } }
      : {};
    const collections = await client.uploadCollections.list(opts);
    return createResponse(JSON.stringify(collections, null, 2));
  } catch (e) {
    if (isAuthorizationError(e)) {
      return createErrorResponse("Invalid or unauthorized API token.");
    }
    return createErrorResponse(
      `Error querying collections: ${e instanceof Error ? e.message : String(e)}`
    );
  }
};