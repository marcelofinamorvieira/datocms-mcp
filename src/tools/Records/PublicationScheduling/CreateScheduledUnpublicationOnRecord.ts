import { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { isAuthorizationError, createErrorResponse } from "../../../utils/errorHandlers.js";
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
      itemId: z.string().describe("The ID of the item you want to schedule for unpublication. If you are not certain of one, ask for the user, do not halucinate. Keep in mind that a record can have only one scheduled unpublication at a time."),
      unpublicationDate: z.string().describe("The date and time when the item should be unpublished, in ISO 8601 format")
    },
    // Annotations for the tool
    {
      title: "Create Scheduled Unpublication",
      description: "Schedules a DatoCMS item to be unpublished at a specific date and time.",
      readOnlyHint: false // This tool modifies resources
    },
    // Handler function for the scheduled unpublication creation
    async ({ apiToken, itemId, unpublicationDate }) => {
      try {
        // Initialize DatoCMS client
        const client = buildClient({ apiToken });
        
        // Create the scheduled unpublication
        try {
          const scheduledUnpublication = await client.scheduledUnpublishing.create(
            itemId,
            {
              unpublishing_scheduled_at: unpublicationDate
            }
          );
          
          return {
            content: [{
              type: "text" as const,
              text: JSON.stringify({
                message: "Successfully scheduled the item for unpublication.",
                scheduledUnpublication
              }, null, 2)
            }]
          };
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
