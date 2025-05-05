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
      recordId: z.string().describe("The ID of the record whose versions you want to list."),
      returnOnlyIds: z.boolean().optional().describe("If true, returns only an array of version IDs instead of complete version objects. Default is true to save on tokens and context window space since version responses can be colossal (specially without pagination). These IDs can be used for additional operations if needed."),
      limit: z.number().optional().describe("Optional limit for pagination. If provided along with offset, enables pagination and returns only the specified number of records on that window."),
      offset: z.number().optional().describe("Optional offset for pagination. Only effective when used with limit parameter. This is the number of records to skip before starting to return records."),
      nested: z.boolean().optional().describe("For Modular Content, Structured Text and Single Block fields. If set to true, returns full payload for nested blocks instead of just their IDs. Default is true.")
    },
    // Annotations for the tool
    {
      title: "List DatoCMS Record Versions",
      description: "Lists all versions of a specific DatoCMS record. Each record version represents a change made to the record over time.",
      readOnlyHint: true // Indicates this tool doesn't modify any resources
    },
    // Handler function for listing record versions
    async ({ apiToken, recordId, returnOnlyIds = true, limit, offset, nested = true }) => {
      try {
        // Create DatoCMS client
        const client = buildClient({ apiToken });
        
        // Initialize arrays to store versions and version IDs
        const versions = [];
        const versionIds = [];
        
        // Check if pagination is requested
        const isPaginated = typeof limit === 'number' && typeof offset === 'number';
        
        try {
          if (isPaginated) {
            // For paginated requests, use the list method directly
            const queryParams = {
              nested,
              page: {
                limit,
                offset
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
          } else {
            // For non-paginated requests, use the iterator to fetch all pages
            for await (const itemVersion of client.itemVersions.listPagedIterator(recordId, { nested })) {
              // Always collect version IDs
              versionIds.push(itemVersion.id);
              
              // Only collect full version objects if not returning only IDs
              if (!returnOnlyIds) {
                versions.push(itemVersion);
              }
            }
          }
          
          // Return appropriate response based on returnOnlyIds flag
          if (returnOnlyIds) {
            return createResponse(JSON.stringify({
              message: `Successfully retrieved ${versionIds.length} version IDs for the record.`,
              versionIds: versionIds
            }, null, 2));
          }
          
          // Return the full versions as JSON using createResponse for consistent formatting
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
