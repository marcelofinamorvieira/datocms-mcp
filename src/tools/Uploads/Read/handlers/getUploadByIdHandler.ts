import type { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { createResponse } from "../../../../utils/responseHandlers.js";
import {
  isAuthorizationError,
  isNotFoundError,
  createErrorResponse
} from "../../../../utils/errorHandlers.js";
import type { uploadsSchemas } from "../../schemas.js";

export const getUploadByIdHandler = async (
  args: z.infer<typeof uploadsSchemas.get>
) => {
  const { apiToken, uploadId, environment } = args;

  try {
    const clientParams = environment ? { apiToken, environment } : { apiToken };
    const client = buildClient(clientParams);

    try {
      const upload = await client.uploads.find(uploadId);
      if (!upload) {
        return createErrorResponse(
          `Error: Upload with ID '${uploadId}' was not found.`
        );
      }
      return createResponse(JSON.stringify(upload, null, 2));
    } catch (apiError: unknown) {
      if (isAuthorizationError(apiError)) {
        return createErrorResponse(
          "Error: Invalid or unauthorized DatoCMS API token."
        );
      }
      if (isNotFoundError(apiError)) {
        return createErrorResponse(
          `Error: Upload with ID '${uploadId}' was not found.`
        );
      }
      throw apiError;
    }
  } catch (err) {
    return createErrorResponse(
      `Error retrieving upload: ${err instanceof Error ? err.message : String(err)}`
    );
  }
};