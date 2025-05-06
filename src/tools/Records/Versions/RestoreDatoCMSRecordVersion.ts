import { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { isAuthorizationError, isNotFoundError, createErrorResponse } from "../../../utils/errorHandlers.js";
import { createResponse } from "../../../utils/responseHandlers.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Registers the RestoreDatoCMSRecordVersion tool with the MCP server
 */
export const registerRestoreDatoCMSRecordVersion = (server: McpServer) => {
  server.tool(
    // Tool name
    "RestoreDatoCMSRecordVersion",
    // Parameter schema with types
    { 
      apiToken: z.string().describe("DatoCMS API token for authentication. If you are not certain of one, ask for the user, do not halucinate."),
      recordId: z.string().describe("The ID of the record for which to restore a version."),
      versionId: z.string().describe("The ID of the version to restore."),
      environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
    },
    // Annotations for the tool
    {
      title: "Restore DatoCMS Record Version",
      description: "Restores a specific previous version of a DatoCMS record.",
      readOnlyHint: false // This tool modifies resources
    },
    // Handler function for restoring a record version
    async ({ apiToken, recordId, versionId, environment }) => {
      try {
        // Initialize DatoCMS client
        const clientParameters = environment ? { apiToken, environment } : { apiToken };
        const client = buildClient(clientParameters);
        
        try {
          // Restore the specified version
          const restoredVersion = await client.itemVersions.restore(versionId);
          
          return createResponse(JSON.stringify({
            message: `Successfully restored version ${versionId} for record ${recordId}.`,
            version: restoredVersion
          }, null, 2));
          
        } catch (apiError: unknown) {
          if (isAuthorizationError(apiError)) {
            return createErrorResponse("Error: Please provide a valid DatoCMS API token. The token you provided was rejected by the DatoCMS API.");
          }
          
          // Check if it's a not found error
          if (isNotFoundError(apiError)) {
            return createErrorResponse(`Error: Record version with ID '${versionId}' was not found.`);
          }
          
          // Re-throw other API errors to be caught by the outer catch
          throw apiError;
        }
      } catch (error: unknown) {
        return {
          content: [{
            type: "text" as const,
            text: `Error restoring DatoCMS record version: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );
};
