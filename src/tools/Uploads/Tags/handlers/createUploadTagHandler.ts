import type { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import {
  isAuthorizationError,
  createErrorResponse
} from "../../../../utils/errorHandlers.js";
import { createResponse } from "../../../../utils/responseHandlers.js";
import { uploadsSchemas } from "../../schemas.js";

export const createUploadTagHandler = async (
  args: z.infer<typeof uploadsSchemas.create_tag>
) => {
  const { apiToken, name, environment } = args;
  try {
    const client = buildClient(environment ? { apiToken, environment } : { apiToken });
    const tag = await client.uploadTags.create({ name });
    return createResponse(JSON.stringify(tag, null, 2));
  } catch (e) {
    if (isAuthorizationError(e)) {
      return createErrorResponse("Invalid or unauthorized API token.");
    }
    return createErrorResponse(
      `Error creating upload tag: ${e instanceof Error ? e.message : String(e)}`
    );
  }
};