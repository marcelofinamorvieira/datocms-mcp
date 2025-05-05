import { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { isAuthorizationError, createErrorResponse } from "../utils/errorHandlers.js";
import { createResponse } from "../utils/responseHandlers.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { returnMostPopulatedLocale } from "../utils/returnMostPopulatedLocale.js";

/**
 * Registers the QueryDatoCMSRecordsByString tool with the MCP server
 */
export const registerQueryDatoCMSRecordsByString = (server: McpServer) => {
  server.tool(
    // Tool name
    "QueryDatoCMSRecordsByString",
    // Parameter schema with types
    { 
      apiToken: z.string().describe("DatoCMS API token for authentication. If you are not certain of one, ask for the user, do not halucinate."),
      filterQuery: z.string().describe("The raw string to search for in the DatoCMS items. Do not specify field names, just the value. Try to be as general as possible with the string, as this is not fuzzy search, otherwise you may miss results."),
      modelName: z.string().optional().describe("Optional model name to restrict results to. Only pass this if the user is certain of the model name, otherwise ommit it."),
      version: z.enum(["published", "current"]).optional().describe("Whether to retrieve the published version ('published') or the latest draft ('current'). Default is 'published'."),
      returnAllLocales: z.boolean().optional().describe("If true, returns all locale versions for each field instead of only the most populated locale. Default is false to save on token usage."),
      returnOnlyIds: z.boolean().optional().describe("If true, returns only an array of record IDs instead of complete records. Use this to save on tokens and context window space when only IDs are needed. These IDs can then be used with GetDatoCMSRecordById to get detailed information. Default is false."),
      limit: z.number().optional().describe("Optional limit for pagination. If provided along with offset, enables pagination and returns only the specified number of records on that window."),
      offset: z.number().optional().describe("Optional offset for pagination. Only effective when used with limit parameter. This is the number of records to skip before starting to return records."),
      nested: z.boolean().optional().describe("For Modular Content, Structured Text and Single Block fields. If set to true, returns full payload for nested blocks instead of just their IDs. Default is false.")
    },
    // Annotations for the tool
    {
      title: "Query DatoCMS Records",
      description: "Searches and retrieves records from a DatoCMS project using a simple text query. This tool performs a raw text search across all record fields and returns matching items. For more info on those records use GetDatoCMSRecordById after",
      readOnlyHint: true // Indicates this tool doesn't modify any resources
    },
    // Handler function for the DatoCMS query operation
    async ({ apiToken, filterQuery, modelName, version = "current", returnAllLocales = false, returnOnlyIds = false, limit, offset, nested = false }) => {
      try {
        // Initialize DatoCMS client
        const client = buildClient({ apiToken });
        
        // Prepare query parameters
        const queryParams: Record<string, unknown> = {
          filter: { query: filterQuery, type: modelName },
          version,
          nested
        };
        
        // Add pagination if both limit and offset are provided
        const isPaginated = typeof limit === 'number' && typeof offset === 'number';
        if (isPaginated) {
          queryParams.page = {
            limit,
            offset
          };
        }
        
        // Execute the query
        try {
          // For paginated requests, use client.items.list
          if (isPaginated) {
            const paginatedItems = await client.items.list(queryParams);

            // Return empty result message if no items found
            if (paginatedItems.length === 0) {
              return {
                content: [{
                  type: "text" as const,
                  text: "No items found matching your query."
                }]
              };
            }
            
            // Use map approach for collecting IDs
            if (returnOnlyIds) {
              const allItemIds = paginatedItems.map(item => item.id);
              return createResponse(JSON.stringify(allItemIds, null, 2));
            }
            
            // Process items to filter locales
            const allItems = paginatedItems.map(item => 
              returnMostPopulatedLocale(item, returnAllLocales)
            );
            
            // Return processed items
            return createResponse(JSON.stringify(allItems, null, 2));
          }
          
          // For non-paginated requests, use the iterator to get all pages
          const allItems = [];
          const allItemIds = [];
          
          // Collect items or just IDs from the iterator
          for await (const item of client.items.listPagedIterator(queryParams)) {
            // Store the ID for returnOnlyIds mode
            allItemIds.push(item.id);
            
            // Process each item to filter locales unless returnOnlyIds is true
            if (!returnOnlyIds) {
              allItems.push(returnMostPopulatedLocale(item, returnAllLocales));
            }
          }
          
          // Return empty result message if no items found
          if ((returnOnlyIds ? allItemIds.length : allItems.length) === 0) {
            return {
              content: [{
                type: "text" as const,
                text: "No items found matching your query."
              }]
            };
          }

          // Return only IDs if specified, otherwise return full items
          if (returnOnlyIds) {
            return createResponse(JSON.stringify(allItemIds, null, 2));
          }
          
          // Return full items
          return createResponse(JSON.stringify(allItems, null, 2));
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
            text: `Error querying DatoCMS: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );
};
