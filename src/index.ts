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
      filterQuery: z.string().describe("The raw string to search for in the DatoCMS items. Do not specify field names, just the value. Try to be as general as possible with the string, as this is not fuzzy search, otherwise you may miss results."),
      modelName: z.string().optional().describe("Optional model name to restrict results to. Only pass this if the user is certain of the model name, otherwise ommit it.")
    },
    // Annotations for the tool
    {
      title: "Query DatoCMS Records",
      description: "Searches and retrieves records from a DatoCMS project using a simple text query. This tool performs a raw text search across all record fields and returns matching items.",
      readOnlyHint: true // Indicates this tool doesn't modify any resources
    },
    // Handler function for the DatoCMS query operation
    async ({ apiToken, filterQuery, modelName }) => {
      try {
        // Initialize DatoCMS client
        const client = buildClient({ apiToken });
        
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

          return {
            content: [{
              type: "text",
              text: JSON.stringify(items, null, 2)
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

  // Add the DatoCMS URL builder tool with type validation via Zod
  server.tool(
    // Tool name
    "BuildDatoCMSRecordUrl",
    // Parameter schema with types
    { 
      projectUrl: z.string().describe("DatoCMS project URL. If the user did not provide one yet ask for it, do not halucinate."),
      itemTypeId: z.string().describe("The item type ID from DatoCMS, typically available in the item.item_type.id property of a record."),
      itemId: z.string().describe("The ID of the specific record you want to build a URL for.")
    },
    // Annotations for the tool
    {
      title: "Build DatoCMS Record Editor URL",
      description: "Constructs a direct editor URL for a specific DatoCMS record. This allows users to click a link and go directly to editing a particular record in the DatoCMS interface.",
      readOnlyHint: true // Indicates this tool doesn't modify any resources
    },
    // Handler function for the URL builder operation
    async ({ projectUrl, itemTypeId, itemId }) => {
      try {
        // Sanitize the project URL by removing trailing slashes
        const sanitizedProjectUrl = projectUrl.replace(/\/$/, '');
        
        // Construct the editor URL
        const editorUrl = `${sanitizedProjectUrl}/editor/item_types/${itemTypeId}/items/${itemId}/edit`;
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              message: "Here is the URL for the DatoCMS record. You can use this to directly access the record in the DatoCMS editor.",
              url: editorUrl
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error building DatoCMS URL: ${error instanceof Error ? error.message : String(error)}`
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
