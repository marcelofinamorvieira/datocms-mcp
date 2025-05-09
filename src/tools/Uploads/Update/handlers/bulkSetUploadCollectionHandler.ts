import type { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import {
  isAuthorizationError,
  isNotFoundError,
  createErrorResponse
} from "../../../../utils/errorHandlers.js";
import { createResponse } from "../../../../utils/responseHandlers.js";
import { uploadsSchemas } from "../../schemas.js";

export const bulkSetUploadCollectionHandler = async (
  args: z.infer<typeof uploadsSchemas.bulk_set_collection>
) => {
  const { apiToken, uploadIds, collectionId, environment } = args;

  try {
    const clientParams = environment ? { apiToken, environment } : { apiToken };
    const client = buildClient(clientParams);

    await client.uploads.bulkSetUploadCollection({
      uploads: uploadIds.map(id => ({ type: "upload", id })),
      upload_collection: collectionId
        ? { type: "upload_collection", id: collectionId }
        : null
    });

    const action = collectionId
      ? `assigned to collection '${collectionId}'`
      : "removed from their collection";
    return createResponse(`Successfully ${action} ${uploadIds.length} uploads.`);
  } catch (apiError: unknown) {
    if (isAuthorizationError(apiError)) {
      return createErrorResponse("Invalid or unauthorized API token.");
    }
    if (isNotFoundError(apiError)) {
      return createErrorResponse(
        "Specified uploads or collection not found."
      );
    }
    return createErrorResponse(
      `Bulk set collection error: ${
        apiError instanceof Error ? apiError.message : String(apiError)
      }`
    );
  }
};