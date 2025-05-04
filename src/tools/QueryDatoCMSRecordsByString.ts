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
      returnAllLocales: z.boolean().optional().describe("If true, returns all locale versions for each field instead of only the most populated locale. Default is false to save on token usage.")
    },
    // Annotations for the tool
    {
      title: "Query DatoCMS Records",
      description: "Searches and retrieves records from a DatoCMS project using a simple text query. This tool performs a raw text search across all record fields and returns matching items. For more info on those records use GetDatoCMSRecordById after",
      readOnlyHint: true // Indicates this tool doesn't modify any resources
    },
    // Handler function for the DatoCMS query operation
    async ({ apiToken, filterQuery, modelName, version = "current", returnAllLocales = false }) => {
      try {
        // Initialize DatoCMS client
        const client = buildClient({ apiToken });
        
        // Prepare query parameters
        const queryParams: Record<string, unknown> = {
          filter: { query: filterQuery, type: modelName, nested: false },
          version
        };
        
        // Execute the query
        try {

          const allItems = [];

          for await (const item of client.items.listPagedIterator(queryParams)) {
            // Process each item to filter locales (saves on tokens) unless returnAllLocales is true
            allItems.push(returnMostPopulatedLocale(item, returnAllLocales));
          }
          
          if(allItems.length === 0) {
            return {
              content: [{
                type: "text" as const,
                text: "No items found matching your query."
              }]
            };
          }

          // Convert to JSON and create response (will be chunked only if necessary)
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
