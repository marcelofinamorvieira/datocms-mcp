import type { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { createResponse } from "../../../../utils/responseHandlers.js";
import {
  isAuthorizationError,
  isNotFoundError,
  createErrorResponse
} from "../../../../utils/errorHandlers.js";
import { uploadsSchemas } from "../../schemas.js";

export const getUploadReferencesHandler = async (
  args: z.infer<typeof uploadsSchemas.references>
) => {
  const {
    apiToken,
    uploadId,
    nested,
    version,
    returnOnlyIds,
    environment
  } = args;

  try {
    const clientParams = environment ? { apiToken, environment } : { apiToken };
    const client = buildClient(clientParams);

    const references = await client.uploads.references(uploadId, {
      ...(nested !== undefined ? { nested } : {}),
      ...(version ? { version } : {})
    });

    if (!references.length) {
      return createResponse("No records reference this upload.");
    }
    if (returnOnlyIds) {
      return createResponse(JSON.stringify(references.map(r => r.id), null, 2));
    }
    return createResponse(JSON.stringify(references, null, 2));
  } catch (apiError: unknown) {
    if (isAuthorizationError(apiError)) {
      return createErrorResponse("Error: Invalid or unauthorized API token.");
    }
    if (isNotFoundError(apiError)) {
      return createErrorResponse(`Error: Upload '${uploadId}' not found.`);
    }
    return createErrorResponse(
      `Error fetching references: ${
        apiError instanceof Error ? apiError.message : String(apiError)
      }`
    );
  }
};