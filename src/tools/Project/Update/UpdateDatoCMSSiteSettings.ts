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
      
      // Optional site settings parameters
      no_index: z.boolean().optional().describe("Whether the website needs to be indexed by search engines or not."),
      favicon: z.string().nullable().optional().describe("The upload ID for the favicon."),
      name: z.string().optional().describe("Site name."),
      theme: z.any().optional().describe("Site theme settings."),
      locales: z.array(z.string()).min(1).optional().describe("Available locales. Must contain at least one locale."),
      timezone: z.string().optional().describe("Site default timezone."),
      require_2fa: z.boolean().optional().describe("Specifies whether all users of this site need to authenticate using two-factor authentication."),
      ip_tracking_enabled: z.boolean().optional().describe("Specifies whether you want IPs to be tracked in the Project usages section."),
      force_use_of_sandbox_environments: z.boolean().optional().describe("If enabled, blocks schema changes of primary environment."),
      
      // Global SEO settings
      global_seo: z.object({
        site_name: z.string().optional().describe("Site name, used in social sharing."),
        fallback_seo: z.object({
          title: z.string().describe("Default meta title."),
          description: z.string().describe("Default meta description."),
          image: z.string().nullable().describe("The ID of the image."),
          twitter_card: z.enum(["summary", "summary_large_image"]).nullable().optional().describe("Determines how a Twitter link preview is shown."),
        }).optional(),
        title_suffix: z.string().nullable().optional().describe("Title meta tag suffix."),
        facebook_page_url: z.string().nullable().optional().describe("URL of Facebook page."),
        twitter_account: z.string().nullable().optional().describe("Twitter account associated to website.")
      }).nullable().optional().describe("Specifies default global SEO settings."),
    },
    // Annotations for the tool
    {
      title: "Update DatoCMS Site Settings",
      description: "Updates the settings of a DatoCMS site, including SEO, locales, and other project configurations.",
      readOnlyHint: false, // This tool modifies resources
      destructiveHint: true // This tool is destructive
    },
    // Handler function for updating site settings
    async ({ apiToken, ...settings }) => {
      try {
        // Initialize DatoCMS client
        const client = buildClient({ apiToken });
        
        try {
          // At runtime, the DatoCMS client will validate the parameters properly, and this solution allows
          // us to provide comprehensive validation through Zod while still working with the client.
          // biome-ignore lint/suspicious/noExplicitAny: <explanation>
          const site = await client.site.update(settings as any);
          
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
