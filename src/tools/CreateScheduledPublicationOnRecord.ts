import { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { isAuthorizationError, createErrorResponse } from "../utils/errorHandlers.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Registers the CreateScheduledPublicationOnRecord tool with the MCP server
 */
export const registerCreateScheduledPublicationOnRecord = (server: McpServer) => {
  server.tool(
    // Tool name
    "CreateScheduledPublicationOnRecord",
    // Parameter schema with types
    { 
      apiToken: z.string().describe("DatoCMS API token for authentication. If you are not certain of one, ask for the user, do not halucinate."),
      itemId: z.string().describe("The ID of the item you want to schedule for publication."),
      publicationDate: z.string().describe("The date and time when the item should be published, in ISO 8601 format")
    },
    // Annotations for the tool
    {
      title: "Create Scheduled Publication",
      description: "Schedules a DatoCMS item to be published at a specific date and time.",
      readOnlyHint: false // This tool modifies resources
    },
    // Handler function for the scheduled publication creation
    async ({ apiToken, itemId, publicationDate }) => {
      try {
        // Initialize DatoCMS client
        const client = buildClient({ apiToken });
        
        // Create the scheduled publication
        try {
          const scheduledPublication = await client.scheduledPublication.create(
            itemId,
            {
              publication_scheduled_at: publicationDate
            }
          );
          
          return {
            content: [{
              type: "text" as const,
              text: JSON.stringify({
                message: "Successfully scheduled the item for publication.",
                scheduledPublication
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
            text: `Error creating scheduled publication: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );
};
