import { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { isAuthorizationError, createErrorResponse } from "../../../utils/errorHandlers.js";
import { createResponse } from "../../../utils/responseHandlers.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Registers the CreateDatoCMSUpload tool with the MCP server
 */
export const registerCreateDatoCMSUpload = (server: McpServer) => {
  server.tool(
    // Tool name
    "CreateDatoCMSUpload",
    // Parameter schema with types
    { 
      apiToken: z.string().describe("DatoCMS API token for authentication. If you are not certain of one, ask for the user, do not hallucinate."),
      
      // Source options - one of these is required
      url: z.string().optional().describe("Remote URL of the file to upload to DatoCMS. Either url or path must be provided."),
      path: z.string().optional().describe("Local file path to upload. Either url or path must be provided."),
      
      // Optional parameters
      id: z.string().optional().describe("Optional RFC 4122 UUID of upload expressed in URL-safe base64 format"),
      filename: z.string().optional().describe("Optional custom filename for the uploaded file when using url. If not provided, the original filename from the URL will be used."),
      skipCreationIfAlreadyExists: z.boolean().optional().default(false).describe("If true, will skip the upload and return an existing resource if it's already present in the Media Area. Only applies when using url. Default is false."),
      author: z.string().nullable().optional().describe("Optional author attribution for the uploaded file"),
      copyright: z.string().nullable().optional().describe("Optional copyright information for the uploaded file"),
      notes: z.string().nullable().optional().describe("Optional notes about the uploaded file"),
      tags: z.array(z.string()).optional().describe("Optional array of tags to assign to the uploaded file"),
      default_field_metadata: z.record(z.record(z.unknown())).optional().describe("For each of the project's locales, the default metadata to apply if nothing is specified at record's level. Example: { en: { title: 'default title', alt: 'default alt text', custom_data: { foo: 'bar' }, focal_point: { x: 0.5, y: 0.5 } } }"),
      upload_collection: z.string().nullable().optional().describe("Optional upload collection ID to assign the upload to")
    },
    // Annotations for the tool
    {
      title: "Create DatoCMS Upload",
      description: "Creates a new upload (asset) in DatoCMS from a remote URL or local path",
      readOnlyHint: false // This tool modifies resources
    },
    // Handler function for creating uploads
    async ({ apiToken, url, path, id, filename, skipCreationIfAlreadyExists, author, copyright, notes, tags, default_field_metadata, upload_collection }) => {
      try {
        // Initialize DatoCMS client
        const client = buildClient({ apiToken });
        
        // Validate that either url or path is provided
        if (!url && !path) {
          return createErrorResponse("Error: Either url or path must be provided to create an upload.");
        }
        
        // Common metadata parameters for both URL and direct upload
        const metadataParams: Record<string, unknown> = {};
        if (id) metadataParams.id = id;
        if (author !== undefined) metadataParams.author = author;
        if (copyright !== undefined) metadataParams.copyright = copyright;
        if (notes !== undefined) metadataParams.notes = notes;
        if (tags) metadataParams.tags = tags;
        if (default_field_metadata) metadataParams.default_field_metadata = default_field_metadata;
        if (upload_collection !== undefined) metadataParams.upload_collection = upload_collection;
        
        try {
          let upload: unknown;
          
          // Create from URL
          if (url) {
            // Create a properly typed object for URL uploads
            // The URL is required for createFromUrl
            upload = await client.uploads.createFromUrl({
              url,
              ...(filename ? { filename } : {}),
              ...(typeof skipCreationIfAlreadyExists === 'boolean' ? { skipCreationIfAlreadyExists } : {}),
              ...metadataParams
            });
          } 
          // Create from local path
          else if (path) {
            // The path is required for direct create
            upload = await client.uploads.create({
              path,
              ...metadataParams
            });
          }
          
          // Return the created upload data
          return createResponse(JSON.stringify(upload, null, 2));
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
            text: `Error creating DatoCMS upload: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );
};
