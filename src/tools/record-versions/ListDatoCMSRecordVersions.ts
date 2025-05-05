import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { buildClient } from "@datocms/cma-client-node";
import { createErrorResponse } from "../../utils/errorHandlers.js";
import { createResponse } from "../../utils/responseHandlers.js";

/**
 * Registers the ListDatoCMSRecordVersions tool with the MCP server
 */
export const registerListDatoCMSRecordVersions = (server: McpServer) => {
  server.tool(
    // Tool name
    "ListDatoCMSRecordVersions",
    // Parameter schema with types
    {
      apiToken: z.string().describe("DatoCMS API token with proper permissions."),
      recordId: z.string().describe("The ID of the record whose versions you want to list.")
    },
    // Annotations for the tool
    {
      title: "List DatoCMS Record Versions",
      description: "Lists all versions of a specific DatoCMS record. Each record version represents a change made to the record over time.",
      readOnlyHint: true // Indicates this tool doesn't modify any resources
    },
    // Handler function for listing record versions
    async ({ apiToken, recordId }) => {
      try {
        // Create DatoCMS client
        const client = buildClient({ apiToken });
        
        // Initialize an array to store all versions
        const versions = [];
        
        // Use the iterator to fetch all pages of results
        try {
          // Fetch all versions of the record
          for await (const itemVersion of client.itemVersions.listPagedIterator(recordId)) {
            versions.push(itemVersion);
          }
          
          // Return the versions as JSON using createResponse for consistent formatting
          return createResponse(JSON.stringify({
            message: `Successfully retrieved ${versions.length} versions for the record.`,
            versions: versions
          }, null, 2));
          
        } catch (error: unknown) {
          return createErrorResponse(
            `Error fetching record versions: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      } catch (error: unknown) {
        return createErrorResponse(
          `Error initializing DatoCMS client: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );
};
