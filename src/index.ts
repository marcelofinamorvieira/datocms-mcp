import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import type { SimpleSchemaTypes } from "@datocms/cma-client-node";
// Required for DatoCMS client
import fetch from "node-fetch";

// Polyfill fetch for DatoCMS client
// @ts-ignore - Necessary for runtime compatibility
globalThis.fetch = fetch;

/**
 * Creates and configures an MCP server with DatoCMS query capabilities
 */
const createServer = () => {
  // Create an MCP server with metadata
  const server = new McpServer({
    name: "DatoCMSTools",
    version: "1.0.0",
    description: "MCP server providing DatoCMS query tools and utilities"
  });

  // Add the DatoCMS query tool with type validation via Zod
  server.tool(
    // Tool name
    "QueryDatoCMSRecords",
    // Parameter schema with types
    { 
      apiToken: z.string().describe("DatoCMS API token for authentication. If you are not certain of one, ask for the user, do not halucinate."),
      projectUrl: z.string().describe("DatoCMS project URL. If you are not certain of one, ask for the user, do not halucinate."),
      filterQuery: z.string().describe("The raw string to search for in the DatoCMS items. Do not specify field names, just the value. Try to be as general as possible with the string, as this is not fuzzy search, otherwise you may miss results."),
      modelName: z.string().optional().describe("Optional model name to restrict results to. Only pass this if the user is certain of the model name, otherwise ommit it.")
    },
    // Annotations for the tool
    {
      title: "Query DatoCMS Records from string.",
      description: "This tool allows you to search and retrieve a record from a DatoCMS project a string as a parameter.",
      readOnlyHint: true // Indicates this tool doesn't modify any resources
    },
    // Handler function for the DatoCMS query operation
    async ({ apiToken, projectUrl, filterQuery, modelName }) => {
      try {
        // Initialize DatoCMS client
        const client = buildClient({ apiToken });
        
        // Store the project URL for potential future use
        // Note: The DatoCMS client uses the API token to determine the project
        
        // Prepare query parameters
        const queryParams: Record<string, unknown> = {
          filter: { query: filterQuery, type: modelName }
        };
        
        // Execute the query
        try {
          const items = await client.items.list(queryParams);
          
          if(items.length === 0) {
            return {
              content: [{
                type: "text",
                text: "No items found matching your query."
              }]
            };
          }

          // Add editor URL to each item
          const itemsWithUrl = items.map(item => {
            // Construct the editor URL using the item data
            // The structure follows DatoCMS API response format
            const itemTypeId = item.item_type.id;
            return {
              ...item,
              editorUrl: `${projectUrl}/editor/item_types/${itemTypeId}/items/${item.id}/edit`
            };
          });

          // Create a response with both formatted URLs and full data
          const formattedResponse = {
            message: "Records found matching your query. Here is the record content and its URL. Make sure to include the url at the end of your response, so the user knows where to find this info.",
            recordIdsAndUrls: itemsWithUrl.map(item => {
              return {
                id: item.id,
                url: item.editorUrl
              };
            }),
            recordData: itemsWithUrl
          };

          return {
            content: [{
              type: "text",
              text: JSON.stringify(formattedResponse, null, 2)
            }]
          };
        } catch (apiError: unknown) {
          // Check if it's an authorization error (invalid token)
          if (
            typeof apiError === 'object' && 
            apiError !== null && 
            ('status' in apiError && apiError.status === 401 ||
             'message' in apiError && typeof apiError.message === 'string' && 
             (apiError.message.includes('401') || apiError.message.toLowerCase().includes('unauthorized')))
          ) {
            return {
              content: [{
                type: "text",
                text: "Error: Please provide a valid DatoCMS API token. The token you provided was rejected by the DatoCMS API."
              }]
            };
          }
          
          // Re-throw other API errors to be caught by the outer catch
          throw apiError;
        }
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error querying DatoCMS: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );

  return server;
};

/**
 * Main function to start the MCP server
 */
const main = async () => {
  try {
    const server = createServer();
    
    // For simplicity, we'll use stdio transport only
    // No console.log here - it breaks the MCP protocol
    const transport = new StdioServerTransport();
    await server.connect(transport);
  } catch (error) {
    // Log errors to stderr instead of stdout
    console.error("Error starting MCP server:", error);
    process.exit(1);
  }
};

// Start the server
main();
