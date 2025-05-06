import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Registers the BuildDatoCMSRecordUrl tool with the MCP server
 */
export const registerBuildDatoCMSRecordUrl = (server: McpServer) => {
  server.tool(
    // Tool name
    "BuildDatoCMSRecordUrl",
    // Parameter schema with types
    { 
      projectUrl: z.string().describe("DatoCMS project URL. If the user did not provide one yet use the tool GetDatoCMSProjectInfo to retrieve it, it will be under the internal_domain property. Do not halucinate."),
      itemTypeId: z.string().describe("The item type ID from DatoCMS, typically available in the item.item_type.id property of a record."),
      itemId: z.string().describe("The ID of the specific record you want to build a URL for."),
      environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
    },
    // Annotations for the tool
    {
      title: "Build DatoCMS Record Editor URL",
      description: "Constructs a direct editor URL for a specific DatoCMS record. This allows users to click a link and go directly to editing a particular record in the DatoCMS interface.",
      readOnlyHint: true // Indicates this tool doesn't modify any resources
    },
    // Handler function for the URL builder operation
    async ({ projectUrl, itemTypeId, itemId, environment }) => {
      try {
        // Sanitize the project URL by removing trailing slashes
        const sanitizedProjectUrl = projectUrl.replace(/\/$/, '');
        
        // Construct the editor URL
        let editorUrl = `https://${sanitizedProjectUrl}/editor/item_types/${itemTypeId}/items/${itemId}/edit`;
        
        // Add environment parameter if specified
        if (environment) {
          editorUrl += `?environment=${encodeURIComponent(environment)}`;
        }
        
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              message: "Here is the URL for the DatoCMS record. You can use this to directly access the record in the DatoCMS editor.",
              url: editorUrl
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text" as const,
            text: `Error building DatoCMS URL: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );
};
