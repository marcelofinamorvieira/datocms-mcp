import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
// Required for DatoCMS client
import fetch from "node-fetch";

// Import all tool registration functions
import {
  registerQueryDatoCMSRecordsByString,
  registerBuildDatoCMSRecordUrl,
  registerCreateScheduledPublicationOnRecord,
  registerDestroyScheduledPublicationOnRecord,
  registerGetDatoCMSRecordById,
  registerGetDatoCMSProjectInfo,
  registerCreateScheduledUnpublicationOnRecord,
  registerDestroyScheduledUnpublicationOnRecord,
  registerGetDatoCMSRecordReferences
} from "./tools/index.js";

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

  // Register all tools

  //Project meta info

  registerGetDatoCMSProjectInfo(server);

  //Record Querying

  registerGetDatoCMSRecordById(server);
  registerQueryDatoCMSRecordsByString(server);
  registerGetDatoCMSRecordReferences(server);

  //Record Scheduling

  registerCreateScheduledPublicationOnRecord(server);
  registerDestroyScheduledPublicationOnRecord(server);
  registerCreateScheduledUnpublicationOnRecord(server);
  registerDestroyScheduledUnpublicationOnRecord(server);

  //Record Utilities

  registerBuildDatoCMSRecordUrl(server);


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
