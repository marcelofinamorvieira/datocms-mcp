import { buildClient } from "@datocms/cma-client-node";
import { createErrorResponse } from "../../../../../utils/errorHandlers.js";
import { createResponse } from "../../../../../utils/responseHandlers.js";
import { deployEventSchemas } from "../../../schemas.js";
import { z } from "zod";

type RetrieveDeployEventParams = z.infer<typeof deployEventSchemas.retrieve>;

/**
 * Retrieves a specific deploy event by ID
 * 
 * @param params Parameters for retrieving a deploy event
 * @returns Response with the deploy event details
 */
export async function retrieveDeployEventHandler(
  params: RetrieveDeployEventParams
) {
  try {
    // Initialize the client with the API token and environment
    const clientParams = params.environment 
      ? { apiToken: params.apiToken, environment: params.environment } 
      : { apiToken: params.apiToken };
    const client = buildClient(clientParams);

    // Fetch the specific deploy event
    const event = await client.buildEvents.find(params.eventId);

    // Format the response
    return createResponse({
      id: event.id,
      build_trigger_id: params.buildTriggerId,
      type: event.type,
      event_type: event.event_type,
      data: event.data,
      created_at: event.created_at
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

    // Handle not found errors
    if (
      typeof error === 'object' && 
      error !== null && 
      ('status' in error && error.status === 404 ||
       'message' in error && typeof error.message === 'string' && 
       (error.message.includes('404') || error.message.toLowerCase().includes('not found')))
    ) {
      return createErrorResponse(
        `No deploy event found with ID: ${params.eventId} for build trigger: ${params.buildTriggerId}`
      );
    }

    // Handle other errors
    return createErrorResponse(
      `Failed to retrieve deploy event: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}