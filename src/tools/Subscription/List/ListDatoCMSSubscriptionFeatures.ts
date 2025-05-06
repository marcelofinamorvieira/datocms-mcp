import { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { isAuthorizationError, createErrorResponse } from "../../../utils/errorHandlers.js";
import { createResponse } from "../../../utils/responseHandlers.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Registers the ListDatoCMSSubscriptionFeatures tool with the MCP server
 */
export const registerListDatoCMSSubscriptionFeatures = (server: McpServer) => {
  server.tool(
    // Tool name
    "ListDatoCMSSubscriptionFeatures",
    // Parameter schema with types
    { 
      apiToken: z.string().describe("DatoCMS API token for authentication.")
    },
    // Annotations for the tool
    {
      title: "List DatoCMS Subscription Features",
      description: "Retrieves all the subscription features for the DatoCMS project, showing which special features are enabled for the current plan.",
      readOnlyHint: true // This tool only reads resources
    },
    // Handler function for listing subscription features
    async ({ apiToken }) => {
      try {
        // Initialize DatoCMS client
        const client = buildClient({ apiToken });
        
        try {
          // List all subscription features
          const subscriptionFeatures = await client.subscriptionFeatures.list();
          
          if (!subscriptionFeatures || subscriptionFeatures.length === 0) {
            return createResponse(JSON.stringify([], null, 2));
          }
          
          return createResponse(JSON.stringify(subscriptionFeatures, null, 2));
          
        } catch (apiError: unknown) {
          if (isAuthorizationError(apiError)) {
            return createErrorResponse("Error: Please provide a valid DatoCMS API token. The token you provided was rejected by the DatoCMS API.");
          }
          
          // Re-throw other API errors to be caught by the outer catch
          throw apiError;
        }
      } catch (error: unknown) {
        return {
          content: [{
            type: "text" as const,
            text: `Error listing subscription features: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );
};
