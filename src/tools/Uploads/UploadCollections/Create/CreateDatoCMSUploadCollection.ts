import { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { isAuthorizationError, createErrorResponse } from "../../../../utils/errorHandlers.js";
import { createResponse } from "../../../../utils/responseHandlers.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Registers the CreateDatoCMSUploadCollection tool with the MCP server
 */
export const registerCreateDatoCMSUploadCollection = (server: McpServer) => {
  server.tool(
    // Tool name
    "CreateDatoCMSUploadCollection",
    // Parameter schema with types
    {
      apiToken: z.string().describe("DatoCMS API token for authentication. If you are not certain of one, ask for the user, do not hallucinate."),
      
      // Required parameters
      label: z.string().describe("The label of the upload collection"),
      
      // Optional parameters
      id: z.string().optional().describe("RFC 4122 UUID of upload collection expressed in URL-safe base64 format"),
      position: z.number().optional().describe("Ordering index"),
      parent: z.object({
        type: z.literal("upload_collection"),
        id: z.string()
      }).optional().describe("Parent upload collection reference"),
      environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
    },
    // Annotations for the tool
    {
      title: "Create DatoCMS Upload Collection",
      description: "Creates a new upload collection in DatoCMS",
      readOnlyHint: false, // This tool modifies resources
      destructiveHint: false // This tool creates rather than destroys resources
    },
    // Handler function for creating an upload collection
    async ({ apiToken, label, id, position, parent, environment }) => {
      try {
        // Initialize DatoCMS client
        const clientParameters = environment ? { apiToken, environment } : { apiToken };
        const client = buildClient(clientParameters);
        
        // Prepare creation parameters
        // Using an interface that matches the expected structure
        const createParams: {
          label: string;
          id?: string;
          position?: number;
          parent?: { type: "upload_collection", id: string };
        } = {
          label
        };
        
        // Add optional parameters if provided
        if (id) {
          createParams.id = id;
        }
        
        if (typeof position === 'number') {
          createParams.position = position;
        }
        
        if (parent) {
          createParams.parent = parent;
        }
        
        try {
          // Create the new upload collection
          const newUploadCollection = await client.uploadCollections.create(createParams);
          
          // Return the created upload collection
          return createResponse(JSON.stringify(newUploadCollection, null, 2));
        } catch (apiError: unknown) {
          if (isAuthorizationError(apiError)) {
            return createErrorResponse("Error: Please provide a valid DatoCMS API token. The token you provided was rejected by the DatoCMS API.");
          }
          
          // Re-throw other API errors to be caught by the outer catch
          throw apiError;
        }
      } catch (error) {
        return {
          content: [{
            type: "text" as const,
            text: `Error creating DatoCMS upload collection: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );
};
