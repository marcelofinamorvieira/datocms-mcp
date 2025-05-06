/**
 * @file index.ts
 * @description Entry point for the DatoCMS ModelContextProtocol (MCP) server.
 * This server provides tools for querying, managing, and interacting with
 * DatoCMS content through the MCP interface.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
// Required for DatoCMS client's HTTP requests
import fetch from "node-fetch";

// Import all tool registration functions
// Records tools are now consolidated into a router tool
import { registerRecordsRouter } from "./tools/Records/RecordsRouterTool.js";
import { registerGetParametersTool } from "./tools/DocumentationTool.js";
import { 
  registerProjectRouter, 
  registerGetDatoCMSUploadById,
  registerGetDatoCMSUploadReferences,
  registerQueryDatoCMSUploads,
  registerBulkDestroyDatoCMSUploads,
  registerDestroyDatoCMSUpload,
  registerListDatoCMSEnvironments,
  registerForkDatoCMSEnvironment,
  registerGetDatoCMSModel,
  registerListDatoCMSModels,
  registerDuplicateDatoCMSModel,
} from "./tools/index.js";

// Import Upload Collection tools directly from their location
import { registerGetDatoCMSUploadCollection } from "./tools/Uploads/UploadCollections/Read/GetDatoCMSUploadCollection.js";
import { registerQueryDatoCMSUploadCollections } from "./tools/Uploads/UploadCollections/Read/QueryDatoCMSUploadCollections.js";
import { registerCreateDatoCMSUploadCollection } from "./tools/Uploads/UploadCollections/Create/CreateDatoCMSUploadCollection.js";
import { registerUpdateDatoCMSUploadCollection } from "./tools/Uploads/UploadCollections/Update/UpdateDatoCMSUploadCollection.js";
import { registerDeleteDatoCMSUploadCollection } from "./tools/Uploads/UploadCollections/Delete/DeleteDatoCMSUploadCollection.js";

// Apply fetch polyfill for DatoCMS client compatibility
// @ts-ignore - Type definition mismatch between node-fetch and global fetch
globalThis.fetch = fetch;

/**
 * Creates and configures an MCP server with DatoCMS integration capabilities.
 * 
 * @returns {McpServer} A configured MCP server instance with all DatoCMS tools registered
 */
const createServer = (): McpServer => {
  // Initialize the MCP server with identifying metadata
  const server = new McpServer({
    name: "DatoCMSTools",
    version: "1.0.0",
    description: "MCP server providing DatoCMS query tools and utilities"
  });

  // Register DatoCMS tools with clear order (parameters first, then execution)
  registerGetParametersTool(server); // Parameters tool MUST be registered FIRST
  registerRecordsRouter(server);     // Execute tool for records
  registerProjectRouter(server);     // Execute tool for project operations

  // Upload tools
  // registerGetDatoCMSUploadById(server);
  // registerGetDatoCMSUploadReferences(server);
  // registerQueryDatoCMSUploads(server);
  // registerBulkDestroyDatoCMSUploads(server);
  // registerDestroyDatoCMSUpload(server);

  // Environment tools
  // registerListDatoCMSEnvironments(server);
  // registerForkDatoCMSEnvironment(server);

  // Model tools
  // registerGetDatoCMSModel(server);
  // registerListDatoCMSModels(server);
  // registerDuplicateDatoCMSModel(server);

  return server;
};

/**
 * Main application entry point that initializes and starts the MCP server.
 * 
 * This function:  
 * 1. Creates the server using createServer()
 * 2. Sets up stdio transport for MCP communication
 * 3. Establishes the connection between server and transport
 * 4. Handles any errors during initialization
 * 
 * @returns {Promise<void>}
 */
const main = async (): Promise<void> => {
  try {
    // Initialize the configured MCP server
    const server = createServer();

    // Create stdio transport for MCP communication
    const transport = new StdioServerTransport();
    
    // Connect transport to the MCP server
    server.connect(transport);
    
    console.error("DatoCMS MCP server started and ready");
    
  } catch (error) {
    console.error("Error starting MCP server:", error);
    process.exit(1);
  }
};

// Bootstrap the application
main();
