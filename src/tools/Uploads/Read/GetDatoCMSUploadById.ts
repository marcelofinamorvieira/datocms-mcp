import { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { isAuthorizationError, isNotFoundError, createErrorResponse } from "../../../utils/errorHandlers.js";
import { createResponse } from "../../../utils/responseHandlers.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Registers the GetDatoCMSUploadById tool with the MCP server
 */
export const registerGetDatoCMSUploadById = (server: McpServer) => {
  server.tool(
    // Tool name
    "GetDatoCMSUploadById",
    // Parameter schema with types
    { 
      apiToken: z.string().describe("DatoCMS API token for authentication. If you are not certain of one, ask for the user, do not halucinate."),
      uploadId: z.string().describe("The ID of the specific DatoCMS upload to retrieve."),
      environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
    },
    // Annotations for the tool
    {
      title: "Get DatoCMS Upload By ID",
      description: "Retrieves a specific DatoCMS upload by its ID. Returns a resource object of type upload with details about the file.",
      readOnlyHint: true // Indicates this tool doesn't modify any resources
    },
    // Handler function for retrieving a specific upload
    async ({ apiToken, uploadId, environment }) => {
      try {
        // Initialize DatoCMS client
        const clientParameters = environment ? { apiToken, environment } : { apiToken };
        const client = buildClient(clientParameters);
        
        try {
          // Retrieve the upload
          const upload = await client.uploads.find(uploadId);
          
          // If no upload found, return error
          if (!upload) {
            return createErrorResponse(`Error: Upload with ID '${uploadId}' was not found.`);
          }

          // Convert to JSON and create response
          return createResponse(JSON.stringify(upload, null, 2));
          
        } catch (apiError: unknown) {
          if (isAuthorizationError(apiError)) {
            return createErrorResponse("Error: Please provide a valid DatoCMS API token. The token you provided was rejected by the DatoCMS API.");
          }
          
          // Check if it's a not found error
          if (isNotFoundError(apiError)) {
            return createErrorResponse(`Error: Upload with ID '${uploadId}' was not found.`);
          }
          
          // Re-throw other API errors to be caught by the outer catch
          throw apiError;
        }
      } catch (error) {
        return {
          content: [{
            type: "text" as const,
            text: `Error retrieving DatoCMS upload: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );
};
