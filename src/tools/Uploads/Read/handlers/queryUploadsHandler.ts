import type { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { createResponse } from "../../../../utils/responseHandlers.js";
import {
  isAuthorizationError,
  createErrorResponse
} from "../../../../utils/errorHandlers.js";
import { uploadsSchemas } from "../../schemas.js";

export const queryUploadsHandler = async (
  args: z.infer<typeof uploadsSchemas.query>
) => {
  const {
    apiToken,
    ids,
    query,
    fields,
    locale,
    order_by,
    page,
    returnOnlyIds,
    environment
  } = args;

  try {
    const clientParams = environment ? { apiToken, environment } : { apiToken };
    const client = buildClient(clientParams);

    // Build query
    const filter: Record<string, unknown> = {};
    if (ids) filter.ids = ids;
    if (query) filter.query = query;
    if (fields && Object.keys(fields).length) filter.fields = fields;

    const queryParams: Record<string, unknown> = {};
    if (Object.keys(filter).length) queryParams.filter = filter;
    if (locale) queryParams.locale = locale;
    if (order_by) queryParams.order_by = order_by;
    queryParams.page = {
      limit: page?.limit ?? 15,
      offset: page?.offset ?? 0
    };

    const uploads = await client.uploads.list(queryParams);

    if (!uploads.length) {
      return createResponse("No uploads matched your query.");
    }
    if (returnOnlyIds) {
      return createResponse(JSON.stringify(uploads.map(u => u.id), null, 2));
    }
    return createResponse(JSON.stringify(uploads, null, 2));
  } catch (apiError: unknown) {
    if (isAuthorizationError(apiError)) {
      return createErrorResponse(
        "Error: Invalid or unauthorized DatoCMS API token."
      );
    }
    return createErrorResponse(
      `Error querying uploads: ${apiError instanceof Error ? apiError.message : String(apiError)}`
    );
  }
};