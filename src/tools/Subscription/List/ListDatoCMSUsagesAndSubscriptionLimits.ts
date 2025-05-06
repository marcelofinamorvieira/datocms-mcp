import { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { isAuthorizationError, createErrorResponse } from "../../../utils/errorHandlers.js";
import { createResponse } from "../../../utils/responseHandlers.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Registers the ListDatoCMSUsagesAndSubscriptionLimits tool with the MCP server
 */
export const registerListDatoCMSUsagesAndSubscriptionLimits = (server: McpServer) => {
  server.tool(
    // Tool name
    "ListDatoCMSUsagesAndSubscriptionLimits",
    // Parameter schema with types
    { 
      apiToken: z.string().describe("DatoCMS API token for authentication.")
    },
    // Annotations for the tool
    {
      title: "List DatoCMS Usages and Subscription Limits",
      description: "Retrieves all the usage and subscription limits for the DatoCMS project.",
      readOnlyHint: true // This tool only reads resources
    },
    // Handler function for listing subscription limits
    async ({ apiToken }) => {
      try {
        // Initialize DatoCMS client
        const client = buildClient({ apiToken });
        
        try {
          // List all subscription limits
          const subscriptionLimits = await client.subscriptionLimits.list();
          
          if (!subscriptionLimits || subscriptionLimits.length === 0) {
            return createResponse(JSON.stringify([], null, 2));
          }
          
          return createResponse(JSON.stringify(subscriptionLimits, null, 2));
          
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
            text: `Error listing subscription limits: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );
};
