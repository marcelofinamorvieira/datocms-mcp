import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { buildClient } from "@datocms/cma-client-node";
import { createErrorResponse } from "../../../utils/errorHandlers.js";
import { createResponse } from "../../../utils/responseHandlers.js";

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
      recordId: z.string().describe("The ID of the record whose versions you want to list."),
      returnOnlyIds: z.boolean().optional().default(true).describe("If true, returns only an array of version IDs instead of complete version objects. Default is true to save on tokens and context window space since version responses can be colossal."),
      page: z.object({
        offset: z.number().int().optional().describe("The (zero-based) offset of the first entity returned in the collection (defaults to 0)."),
        limit: z.number().int().optional().describe("The maximum number of entities to return (defaults to 5, maximum is 500).")
      }).optional().describe("Parameters to control offset-based pagination."),
      nested: z.boolean().optional().default(true).describe("For Modular Content, Structured Text and Single Block fields. If set to true, returns full payload for nested blocks instead of just their IDs. Default is true."),
      environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
    },
    // Annotations for the tool
    {
      title: "List DatoCMS Record Versions",
      description: "Lists versions of a specific DatoCMS record. Returns a paginated list of versions with a default limit of 5 items. Returns only IDs by default to avoid excessive token usage.",
      readOnlyHint: true // This tool doesn't modify resources
    },
    // Handler function for retrieving versions
    async ({ apiToken, recordId, returnOnlyIds, page, nested, environment }) => {
      try {
        // Create DatoCMS client
        const clientParameters = environment ? { apiToken, environment } : { apiToken };
        const client = buildClient(clientParameters);
        
        // Initialize arrays to store versions and version IDs
        const versions = [];
        const versionIds = [];
        
        try {
          // Always use pagination
          const queryParams = {
            nested,
            page: {
              limit: page?.limit ?? 5,
              offset: page?.offset ?? 0
            }
          };
          
          // Fetch the specific page of versions
          const paginatedVersions = await client.itemVersions.list(recordId, queryParams);
          
          // Process the paginated response
          for (const itemVersion of paginatedVersions) {
            // Always collect version IDs
            versionIds.push(itemVersion.id);
            
            // Only collect full version objects if not returning only IDs
            if (!returnOnlyIds) {
              versions.push(itemVersion);
            }
          }
          
          // Return appropriate response based on returnOnlyIds flag
          if (returnOnlyIds) {
            return createResponse(JSON.stringify({
              totalCount: paginatedVersions.length,
              startingOffset: page?.offset ?? 0,
              limit: page?.limit ?? 5,
              versionIds
            }, null, 2));
          }
          
          return createResponse(JSON.stringify({
            totalCount: paginatedVersions.length,
            startingOffset: page?.offset ?? 0,
            limit: page?.limit ?? 5,
            versions
          }, null, 2));
        } catch (error) {
          // Handle errors
          if (error instanceof Error) {
            if (error.message.includes("404") || error.message.toLowerCase().includes("not found")) {
              return createErrorResponse(`Error: Record with ID '${recordId}' not found or you don't have permission to access it.`);
            }
            
            if (error.message.includes("401") || error.message.toLowerCase().includes("unauthorized")) {
              return createErrorResponse("Error: The provided API token is invalid or doesn't have permission to access this record.");
            }
          }
          throw error; // Re-throw if not handled specifically
        }
      } catch (error) {
        // General error handling
        return createErrorResponse(`Error listing versions: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );
};
