import type { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import {
  isAuthorizationError,
  isNotFoundError,
  createErrorResponse
} from "../../../../utils/errorHandlers.js";
import { createResponse } from "../../../../utils/responseHandlers.js";
import { uploadsSchemas } from "../../schemas.js";

export const destroyUploadHandler = async (
  args: z.infer<typeof uploadsSchemas.destroy>
) => {
  const {
    apiToken,
    uploadId,
    confirmation,
    returnOnlyConfirmation,
    environment
  } = args;

  if (!confirmation) {
    return createErrorResponse(
      "Explicit confirmation=true is required to delete an upload."
    );
  }

  try {
    const clientParams = environment ? { apiToken, environment } : { apiToken };
    const client = buildClient(clientParams);

    const deleted = await client.uploads.destroy(uploadId);
    if (returnOnlyConfirmation) {
      return createResponse(`Successfully deleted upload '${uploadId}'.`);
    }
    return createResponse(JSON.stringify(deleted, null, 2));
  } catch (apiError: unknown) {
    if (isAuthorizationError(apiError)) {
      return createErrorResponse("Invalid or unauthorized API token.");
    }
    if (isNotFoundError(apiError)) {
      return createErrorResponse(`Upload '${uploadId}' not found.`);
    }
    return createErrorResponse(
      `Error deleting upload: ${
        apiError instanceof Error ? apiError.message : String(apiError)
      }`
    );
  }
};