import { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { isAuthorizationError, isNotFoundError, createErrorResponse } from "../../../utils/errorHandlers.js";
import { createResponse } from "../../../utils/responseHandlers.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Registers the DuplicateDatoCMSRecord tool with the MCP server
 */
export const registerDuplicateDatoCMSRecord = (server: McpServer) => {
  server.tool(
    // Tool name
    "DuplicateDatoCMSRecord",
    // Parameter schema with types
    { 
      apiToken: z.string().describe("DatoCMS API token for authentication. If you are not certain of one, ask for the user, do not halucinate."),
      itemId: z.string().describe("The ID of the DatoCMS record to duplicate."),
      returnOnlyConfirmation: z.boolean().optional().describe("If true, returns only a success confirmation message instead of the full record data. Use this to save on token usage. Default is false."),
      environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
    },
    // Annotations for the tool
    {
      title: "Duplicate DatoCMS Record",
      description: "Creates a duplicate of an existing DatoCMS record and returns the newly created record.",
      readOnlyHint: false // This tool modifies resources
    },
    // Handler function for duplicating a record
    async ({ apiToken, itemId, returnOnlyConfirmation = false, environment }) => {
      try {
        // Initialize DatoCMS client
        const clientParameters = environment ? { apiToken, environment } : { apiToken };
        const client = buildClient(clientParameters);
        
        try {
          // Duplicate the item
          const duplicatedItem = await client.items.duplicate(itemId);
          
          // If no item returned, return error
          if (!duplicatedItem) {
            return createErrorResponse(`Error: Failed to duplicate record with ID '${itemId}'.`);
          }

          // Return only confirmation message if requested (to save on tokens)
          if (returnOnlyConfirmation) {
            return createResponse(`Successfully duplicated record with ID '${itemId}'. New record ID: '${duplicatedItem.id}'`);
          }

          // Otherwise return the full record data
          return createResponse(JSON.stringify(duplicatedItem, null, 2));
          
        } catch (apiError: unknown) {
          if (isAuthorizationError(apiError)) {
            return createErrorResponse("Error: Please provide a valid DatoCMS API token. The token you provided was rejected by the DatoCMS API.");
          }
          
          // Check if it's a not found error
          if (isNotFoundError(apiError)) {
            return createErrorResponse(`Error: Record with ID '${itemId}' was not found.`);
          }
          
          // Re-throw other API errors to be caught by the outer catch
          throw apiError;
        }
      } catch (error) {
        return {
          content: [{
            type: "text" as const,
            text: `Error duplicating DatoCMS record: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );
};
