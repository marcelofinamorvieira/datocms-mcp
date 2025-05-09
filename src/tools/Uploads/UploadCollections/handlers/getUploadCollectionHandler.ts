import type { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import {
  isAuthorizationError,
  isNotFoundError,
  createErrorResponse
} from "../../../../utils/errorHandlers.js";
import { createResponse } from "../../../../utils/responseHandlers.js";
import { uploadsSchemas } from "../../schemas.js";

export const getUploadCollectionHandler = async (
  args: z.infer<typeof uploadsSchemas.get_collection>
) => {
  const { apiToken, uploadCollectionId, environment } = args;
  try {
    const client = buildClient(environment ? { apiToken, environment } : { apiToken });
    const collection = await client.uploadCollections.find(uploadCollectionId);
    return createResponse(JSON.stringify(collection, null, 2));
  } catch (e) {
    if (isAuthorizationError(e)) {
      return createErrorResponse("Invalid or unauthorized API token.");
    }
    if (isNotFoundError(e)) {
      return createErrorResponse(`Collection '${uploadCollectionId}' not found.`);
    }
    return createErrorResponse(
      `Error retrieving collection: ${e instanceof Error ? e.message : String(e)}`
    );
  }
};