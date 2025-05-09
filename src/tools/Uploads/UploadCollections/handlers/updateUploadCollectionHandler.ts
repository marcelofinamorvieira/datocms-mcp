import type { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import {
  isAuthorizationError,
  isNotFoundError,
  createErrorResponse
} from "../../../../utils/errorHandlers.js";
import { createResponse } from "../../../../utils/responseHandlers.js";
import { uploadsSchemas } from "../../schemas.js";

export const updateUploadCollectionHandler = async (
  args: z.infer<typeof uploadsSchemas.update_collection>
) => {
  const { apiToken, uploadCollectionId, environment, ...data } = args;
  if (Object.keys(data).length === 0) {
    return createErrorResponse("At least one field must be provided for update.");
  }
  try {
    const client = buildClient(environment ? { apiToken, environment } : { apiToken });
    const updated = await client.uploadCollections.update(uploadCollectionId, data);
    return createResponse(JSON.stringify(updated, null, 2));
  } catch (e) {
    if (isAuthorizationError(e)) {
      return createErrorResponse("Invalid or unauthorized API token.");
    }
    if (isNotFoundError(e)) {
      return createErrorResponse(`Collection '${uploadCollectionId}' not found.`);
    }
    return createErrorResponse(
      `Error updating collection: ${e instanceof Error ? e.message : String(e)}`
    );
  }
};