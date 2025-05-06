import { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { isAuthorizationError, createErrorResponse } from "../../../utils/errorHandlers.js";
import { createResponse } from "../../../utils/responseHandlers.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Registers the CreateDatoCMSUploadTag tool with the MCP server
 */
export const registerCreateDatoCMSUploadTag = (server: McpServer) => {
  server.tool(
    // Tool name
    "CreateDatoCMSUploadTag",
    // Parameter schema with types
    { 
      apiToken: z.string().describe("DatoCMS API token for authentication."),
      name: z.string().describe("The tag name to create.")
    },
    // Annotations for the tool
    {
      title: "Create DatoCMS Upload Tag",
      description: "Creates a new upload tag in the DatoCMS project.",
      readOnlyHint: false, // This tool creates resources, so it's not read-only
      destructiveHint: false // This tool doesn't destroy anything
    },
    // Handler function for creating an upload tag
    async ({ apiToken, name }) => {
      try {
        // Initialize DatoCMS client
        const client = buildClient({ apiToken });
        
        try {
          // Prepare the create options
          const createOptions = {
            name
          };
          
          // Create an upload tag
          const uploadTag = await client.uploadTags.create(createOptions);
          
          return createResponse(JSON.stringify(uploadTag, null, 2));
          
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
            text: `Error creating upload tag: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );
};
