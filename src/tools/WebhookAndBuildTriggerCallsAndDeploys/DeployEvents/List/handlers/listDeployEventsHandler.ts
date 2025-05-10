import { buildClient } from "@datocms/cma-client-node";
import { createErrorResponse } from "../../../../../utils/errorHandlers.js";
import { createResponse } from "../../../../../utils/responseHandlers.js";
import { deployEventSchemas } from "../../../schemas.js";
import { z } from "zod";

type ListDeployEventsParams = z.infer<typeof deployEventSchemas.list>;

/**
 * Retrieves a list of deploy events for a build trigger
 * 
 * @param params Parameters for listing deploy events
 * @returns Response with the list of deploy events
 */
export async function listDeployEventsHandler(
  params: ListDeployEventsParams
) {
  try {
    // Initialize the client with the API token and environment
    const clientParams = params.environment 
      ? { apiToken: params.apiToken, environment: params.environment } 
      : { apiToken: params.apiToken };
    const client = buildClient(clientParams);

    // Prepare the query parameters
    const queryParams: Record<string, any> = {};

    // Add pagination parameters if provided
    if (params.page) {
      if (params.page.offset !== undefined) queryParams.page_offset = params.page.offset;
      if (params.page.limit !== undefined) queryParams.page_limit = params.page.limit;
    }

    // Add filter parameters if provided
    if (params.filter) {
      if (params.filter.eventType !== undefined) queryParams.filter_event_type = params.filter.eventType;
    }

    // Fetch deploy events for the specific build trigger
    const deployEvents = await client.buildEvents.list({
      ...queryParams,
      buildTriggerId: params.buildTriggerId
    });

    // Format the response
    return createResponse({
      build_trigger_id: params.buildTriggerId,
      events: deployEvents.map((event: any) => ({
        id: event.id,
        type: event.type,
        event_type: event.event_type,
        data: event.data,
        created_at: event.created_at
      })),
      total: deployEvents.length,
    });
  } catch (error) {
    // Handle authorization errors
    if (
      typeof error === 'object' && 
      error !== null && 
      ('status' in error && error.status === 401 ||
       'message' in error && typeof error.message === 'string' && 
       (error.message.includes('401') || error.message.toLowerCase().includes('unauthorized')))
    ) {
      return createErrorResponse(
        "The provided API token does not have permission to access deploy events."
      );
    }

    // Handle not found errors for the build trigger
    if (
      typeof error === 'object' && 
      error !== null && 
      ('status' in error && error.status === 404 ||
       'message' in error && typeof error.message === 'string' && 
       (error.message.includes('404') || error.message.toLowerCase().includes('not found')))
    ) {
      return createErrorResponse(
        `No build trigger found with ID: ${params.buildTriggerId}`
      );
    }

    // Handle other errors
    return createErrorResponse(
      `Failed to list deploy events: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}