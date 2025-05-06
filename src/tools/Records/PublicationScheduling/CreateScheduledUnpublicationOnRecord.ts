import { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { isAuthorizationError, createErrorResponse } from "../../../utils/errorHandlers.js";
import { createResponse } from "../../../utils/responseHandlers.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Registers the CreateScheduledUnpublicationOnRecord tool with the MCP server
 */
export const registerCreateScheduledUnpublicationOnRecord = (server: McpServer) => {
  server.tool(
    // Tool name
    "CreateScheduledUnpublicationOnRecord",
    // Parameter schema with types
    { 
      apiToken: z.string().describe("DatoCMS API token for authentication. If you are not certain of one, ask for the user, do not halucinate."),
      itemId: z.string().describe("The ID of the item for which to schedule unpublication."),
      unpublicationDate: z.string().describe("The date and time when the item should be unpublished, in ISO 8601 format"),
      environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
    },
    // Annotations for the tool
    {
      title: "Create Scheduled Unpublication",
      description: "Schedules a DatoCMS item to be unpublished at a specific date and time.",
      readOnlyHint: false // This tool modifies resources
    },
    // Handler function for the scheduled unpublication creation
    async ({ apiToken, itemId, unpublicationDate, environment }) => {
      try {
        // Initialize DatoCMS client
        const clientParameters = environment ? { apiToken, environment } : { apiToken };
        const client = buildClient(clientParameters);
        
        try {
          // Create the scheduled unpublication
          const scheduledUnpublication = await client.scheduledUnpublishing.create(
            itemId,
            {
              unpublishing_scheduled_at: unpublicationDate
            }
          );
          
          return createResponse(JSON.stringify({
            message: "Successfully scheduled the item for unpublication.",
            scheduledUnpublication
          }, null, 2));
        } catch (apiError: unknown) {
          if (isAuthorizationError(apiError)) {
            return createErrorResponse("Error: Please provide a valid DatoCMS API token. The token you provided was rejected by the DatoCMS API.");
          }
          
          // Re-throw other API errors to be caught by the outer catch
          throw apiError;
        }
      } catch (error) {
        return {
          content: [{
            type: "text" as const,
            text: `Error creating scheduled unpublication: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );
};
