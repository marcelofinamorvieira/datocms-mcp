import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { buildClient } from "@datocms/cma-client-node";
import { createErrorResponse } from "../../../utils/errorHandlers.js";
import { createResponse } from "../../../utils/responseHandlers.js";

/**
 * Registers the GetDatoCMSRecordVersion tool with the MCP server
 */
export const registerGetDatoCMSRecordVersion = (server: McpServer) => {
  server.tool(
    // Tool name
    "GetDatoCMSRecordVersion",
    // Parameter schema with types
    {
      apiToken: z.string().describe("DatoCMS API token with proper permissions."),
      versionId: z.string().describe("The ID of the specific record version you want to retrieve.")
    },
    // Annotations for the tool
    {
      title: "Get DatoCMS Record Version",
      description: "Retrieves a specific version of a DatoCMS record by its version ID. This allows you to see how the record looked at a particular point in its history.",
      readOnlyHint: true // Indicates this tool doesn't modify any resources
    },
    // Handler function for fetching a specific record version
    async ({ apiToken, versionId }) => {
      try {
        // Create DatoCMS client
        const client = buildClient({ apiToken });
        
        try {
          // Fetch the specific version of the record
          const itemVersion = await client.itemVersions.find(versionId);
          
          // Return the version information as JSON using createResponse for consistent formatting
          return createResponse(JSON.stringify({
            message: `Successfully retrieved record version with ID: ${versionId}`,
            version: itemVersion
          }, null, 2));
          
        } catch (error: unknown) {
          // Handle specific error cases
          if (error instanceof Error && error.message.includes("404")) {
            return createErrorResponse(
              `Record version not found: The version with ID ${versionId} does not exist or has been deleted.`
            );
          }
          
          return createErrorResponse(
            `Error fetching record version: ${error instanceof Error ? error.message : String(error)}`
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
