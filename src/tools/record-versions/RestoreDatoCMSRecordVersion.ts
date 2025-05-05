import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { buildClient } from "@datocms/cma-client-node";
import { createErrorResponse } from "../../utils/errorHandlers.js";
import { createResponse } from "../../utils/responseHandlers.js";

/**
 * Registers the RestoreDatoCMSRecordVersion tool with the MCP server
 */
export const registerRestoreDatoCMSRecordVersion = (server: McpServer) => {
  server.tool(
    // Tool name
    "RestoreDatoCMSRecordVersion",
    // Parameter schema with types
    {
      apiToken: z.string().describe("DatoCMS API token with proper permissions. Must have write access to perform this operation."),
      versionId: z.string().describe("The ID of the record version you want to restore. This will make the record's current state match the state of this version.")
    },
    // Annotations for the tool
    {
      title: "Restore DatoCMS Record Version",
      description: "Restores a record to a previous version state. This modifies the current state of the record to match the state of the specified version.",
      readOnlyHint: false // This tool modifies resources
    },
    // Handler function for restoring a record version
    async ({ apiToken, versionId }) => {
      try {
        // Create DatoCMS client
        const client = buildClient({ apiToken });
        
        try {
          // Restore the record to the specified version
          const restoredVersion = await client.itemVersions.restore(versionId);
          
          // Return the restored version information as JSON using createResponse for consistent formatting
          return createResponse(JSON.stringify({
            message: `Successfully restored record to version with ID: ${versionId}`,
            restoredVersion: restoredVersion
          }, null, 2));
          
        } catch (error: unknown) {
          // Handle specific error cases
          if (error instanceof Error && error.message.includes("404")) {
            return createErrorResponse(
              `Record version not found: The version with ID ${versionId} does not exist or has been deleted.`
            );
          }
          
          if (error instanceof Error && (error.message.includes("403") || error.message.toLowerCase().includes("forbidden"))) {
            return createErrorResponse(
              'Authorization error: The API token provided does not have permission to restore record versions. Please provide a token with write access.'
            );
          }
          
          return createErrorResponse(
            `Error restoring record version: ${error instanceof Error ? error.message : String(error)}`
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
