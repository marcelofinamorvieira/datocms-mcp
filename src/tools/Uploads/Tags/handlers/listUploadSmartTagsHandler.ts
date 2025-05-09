import type { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import {
  isAuthorizationError,
  createErrorResponse
} from "../../../../utils/errorHandlers.js";
import { createResponse } from "../../../../utils/responseHandlers.js";
import { uploadsSchemas } from "../../schemas.js";

export const listUploadSmartTagsHandler = async (
  args: z.infer<typeof uploadsSchemas.list_smart_tags>
) => {
  const { apiToken, filter, page, environment } = args;
  try {
    const client = buildClient(environment ? { apiToken, environment } : { apiToken });
    const opts: any = {};
    if (filter) opts.filter = filter;
    if (page) opts.page = page;
    const smartTags = await client.uploadSmartTags.list(opts);
    return createResponse(JSON.stringify(smartTags, null, 2));
  } catch (e) {
    if (isAuthorizationError(e)) {
      return createErrorResponse("Invalid or unauthorized API token.");
    }
    return createErrorResponse(
      `Error listing smart tags: ${e instanceof Error ? e.message : String(e)}`
    );
  }
};