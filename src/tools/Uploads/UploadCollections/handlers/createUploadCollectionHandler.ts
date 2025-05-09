import type { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import {
  isAuthorizationError,
  createErrorResponse
} from "../../../../utils/errorHandlers.js";
import { createResponse } from "../../../../utils/responseHandlers.js";
import { uploadsSchemas } from "../../schemas.js";

export const createUploadCollectionHandler = async (
  args: z.infer<typeof uploadsSchemas.create_collection>
) => {
  const { apiToken, environment, ...params } = args;
  try {
    const client = buildClient(environment ? { apiToken, environment } : { apiToken });
    const newCol = await client.uploadCollections.create(params);
    return createResponse(JSON.stringify(newCol, null, 2));
  } catch (e) {
    if (isAuthorizationError(e)) {
      return createErrorResponse("Invalid or unauthorized API token.");
    }
    return createErrorResponse(
      `Error creating collection: ${e instanceof Error ? e.message : String(e)}`
    );
  }
};