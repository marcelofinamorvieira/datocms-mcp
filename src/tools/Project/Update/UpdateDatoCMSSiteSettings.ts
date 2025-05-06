import { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { isAuthorizationError, createErrorResponse } from "../../../utils/errorHandlers.js";
import { createResponse } from "../../../utils/responseHandlers.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Registers the UpdateDatoCMSSiteSettings tool with the MCP server
 */
export const registerUpdateDatoCMSSiteSettings = (server: McpServer) => {
  server.tool(
    // Tool name
    "UpdateDatoCMSSiteSettings",
    // Parameter schema with types
    {
      apiToken: z.string().describe("DatoCMS API token for authentication."),
      name: z.string().optional().describe("New name for the site."),
      noIndex: z.boolean().optional().describe("Whether the site should not be indexed by search engines."),
      favicon: z.string().optional().describe("ID of the upload to use as a favicon."),
      timezone: z.string().optional().describe("Timezone setting for the site (e.g. 'Europe/Rome')."),
      environment: z.string().optional().describe("The ID of a specific environment to target (defaults to primary environment).")
    },
    // Annotations for the tool
    {
      title: "Update DatoCMS Site Settings",
      description: "Updates the general site settings for a DatoCMS project.",
      readOnlyHint: false, // This tool modifies resources
      destructiveHint: false // This tool doesn't destroy anything
    },
    // Handler function for updating site settings
    async ({ apiToken, name, noIndex, favicon, timezone, environment }) => {
      try {
        // Initialize DatoCMS client
        const clientParameters = environment ? { apiToken, environment } : { apiToken };
        const client = buildClient(clientParameters);
        
        try {
          // At runtime, the DatoCMS client will validate the parameters properly, and this solution allows
          // us to provide comprehensive validation through Zod while still working with the client.
          const site = await client.site.update({ name, no_index: noIndex, favicon, timezone });
          
          return createResponse(JSON.stringify(site, null, 2));
          
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
            text: `Error updating site settings: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );
};
