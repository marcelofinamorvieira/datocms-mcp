import { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { isAuthorizationError, createErrorResponse } from "../../../utils/errorHandlers.js";
import { createResponse } from "../../../utils/responseHandlers.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import fetch from "node-fetch";
import type { Response as FetchResponse } from "node-fetch";
import fs from "node:fs/promises";
import path from "node:path";
import mime from "mime-types";

// Types for DatoCMS responses
interface UploadRequestResponse {
  data: {
    id: string;
    type: string;
    attributes: {
      url: string;
      request_headers?: Record<string, string>;
    };
  };
}

interface UploadCreateSchema {
  uploadId: string;
  path: string; // Required by DatoCMS API
  id?: string;
  author?: string | null;
  copyright?: string | null;
  notes?: string | null;
  tags?: string[];
  default_field_metadata?: Record<string, Record<string, unknown>>;
  upload_collection?: { type: 'upload_collection', id: string } | null;
  skip_creation_if_already_exists?: boolean;
}

/**
 * Extracts a filename from a URL
 */
const getFilenameFromUrl = (url: string): string => {
  const urlPath = url.split('?')[0]; // Remove query parameters
  const segments = urlPath.split('/');
  return segments[segments.length - 1] || 'downloaded-file';
};

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
      upload_collection: z.object({ type: z.literal('upload_collection'), id: z.string() }).nullable().optional().describe("Optional upload collection ID to assign the upload to"),
      environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
    },
    // Annotations for the tool
    {
      title: "Create DatoCMS Upload",
      description: "Creates a new upload (asset) in DatoCMS from a remote URL or local path",
      readOnlyHint: false // This tool modifies resources
    },
    // Handler function for creating uploads
    async ({ apiToken, url, path: filePath, id, filename, skipCreationIfAlreadyExists, author, copyright, notes, tags, default_field_metadata, upload_collection, environment }) => {
      try {
        // Validate that either url or path is provided
        if (!url && !filePath) {
          return createErrorResponse("Error: Either url or path must be provided to create an upload.");
        }
        
        // Initialize DatoCMS client (for step 3)
        const clientParameters = environment ? { apiToken, environment } : { apiToken };
        const client = buildClient(clientParameters);

        let fileContent: Buffer;
        let fileContentType: string;
        let actualFilename: string;
        
        // Get file content either from URL or local path
        if (url) {
          // If URL is provided, fetch the content
          const response = await fetch(url);
          if (!response.ok) {
            return createErrorResponse(`Error: Failed to fetch file from URL: ${response.statusText}`);
          }
          
          fileContent = Buffer.from(await response.arrayBuffer());
          
          // Get content type and filename from URL if not specified
          fileContentType = response.headers.get('content-type') || 'application/octet-stream';
          actualFilename = filename || getFilenameFromUrl(url);
          
          // Try to guess the extension if the filename doesn't have one
          if (!actualFilename.includes('.')) {
            const ext = mime.extension(fileContentType);
            if (ext) {
              actualFilename = `${actualFilename}.${ext}`;
            }
          }
        } else if (filePath) {
          // If local path is provided, read the file
          try {
            fileContent = await fs.readFile(filePath);
            actualFilename = filename || path.basename(filePath);
            
            // Get content type from the file extension
            fileContentType = mime.lookup(filePath) || 'application/octet-stream';
          } catch (err) {
            return createErrorResponse(`Error: Failed to read file from path: ${err instanceof Error ? err.message : String(err)}`);
          }
        } else {
          // This should never happen due to the validation at the beginning
          return createErrorResponse("Error: Missing both URL and file path.");
        }
        
        // Step 1: Request upload permission
        let uploadRequestResponse: FetchResponse;
        try {
          uploadRequestResponse = await fetch("https://site-api.datocms.com/upload-requests", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiToken}`,
              Accept: "application/json",
              "X-Api-Version": "3",
              "Content-Type": "application/vnd.api+json",
              ...(environment ? { "X-Environment": environment } : {})
            },
            body: JSON.stringify({
              data: { 
                type: "upload_request", 
                attributes: { 
                  filename: actualFilename 
                } 
              },
            }),
          });
          
          if (!uploadRequestResponse.ok) {
            const errorBody = await uploadRequestResponse.text();
            return createErrorResponse(`Error requesting upload permission from DatoCMS: ${uploadRequestResponse.status} ${uploadRequestResponse.statusText} - ${errorBody}`);
          }
        } catch (err) {
          return createErrorResponse(`Error requesting upload permission: ${err instanceof Error ? err.message : String(err)}`);
        }
        
        const uploadRequestData = await uploadRequestResponse.json() as UploadRequestResponse;
        
        if (!uploadRequestData?.data?.id || !uploadRequestData?.data?.attributes?.url) {
          return createErrorResponse(`Invalid response from DatoCMS upload request: ${JSON.stringify(uploadRequestData)}`);
        }
        
        const uploadId = uploadRequestData.data.id;
        const bucketUrl = uploadRequestData.data.attributes.url;
        const requestHeaders = uploadRequestData.data.attributes.request_headers || {};
        
        // Step 2: Upload file to storage bucket
        let uploadToBucketResponse: FetchResponse;
        try {
          // Prepare headers for the upload
          const uploadHeaders: Record<string, string> = {
            ...requestHeaders,
            'Content-Type': fileContentType
          };
          
          uploadToBucketResponse = await fetch(bucketUrl, {
            method: "PUT",
            headers: uploadHeaders,
            body: fileContent
          });
          
          if (!uploadToBucketResponse.ok) {
            const errorBody = await uploadToBucketResponse.text();
            return createErrorResponse(`Error uploading file to bucket: ${uploadToBucketResponse.status} ${uploadToBucketResponse.statusText} - ${errorBody}`);
          }
        } catch (err) {
          return createErrorResponse(`Error uploading file to bucket: ${err instanceof Error ? err.message : String(err)}`);
        }
        
        // Step 3: Create DatoCMS upload record
        try {
          // Prepare the payload for the upload creation
          const createUploadParams: UploadCreateSchema = { 
            uploadId,
            // The path parameter is required by the DatoCMS API but it will be automatically set to the uploadId
            path: uploadId
          };
          
          // Add optional parameters if provided
          if (id) {
            createUploadParams.id = id;
          }
          
          if (author !== undefined) {
            createUploadParams.author = author;
          }
          
          if (copyright !== undefined) {
            createUploadParams.copyright = copyright;
          }
          
          if (notes !== undefined) {
            createUploadParams.notes = notes;
          }
          
          if (tags) {
            createUploadParams.tags = tags;
          }
          
          if (default_field_metadata) {
            createUploadParams.default_field_metadata = default_field_metadata;
          }
          
          if (upload_collection) {
            createUploadParams.upload_collection = upload_collection;
          }
          
          // Only use this parameter for URL uploads (it doesn't apply to file uploads)
          if (url && skipCreationIfAlreadyExists) {
            createUploadParams.skip_creation_if_already_exists = skipCreationIfAlreadyExists;
          }
          
          // Create the upload
          const upload = await client.uploads.create(createUploadParams);
          
          // Return the created upload
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
