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
  registerUploadsRouter,
  registerEnvironmentRouter,
  registerCollaboratorRouter,
  registerRolesRouter,
  // ItemType operations
  registerCreateDatoCMSItemType,
  registerDuplicateDatoCMSItemType,
  registerGetDatoCMSItemType,
  registerListDatoCMSItemTypes,
  registerUpdateDatoCMSItemType,
  registerDeleteDatoCMSItemType
} from "./tools/index.js";

// Import Upload Collection tools directly from their location

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
  registerProjectRouter(server);     // Project actions
  registerUploadsRouter(server);     // All uploads actions (router)
  registerEnvironmentRouter(server); // Environment and maintenance mode actions
  registerCollaboratorRouter(server); // Collaborator and invitation actions
  registerRolesRouter(server);       // Role operations

  // ItemType tools
  registerCreateDatoCMSItemType(server);
  registerDuplicateDatoCMSItemType(server);
  registerGetDatoCMSItemType(server);
  registerListDatoCMSItemTypes(server);
  registerUpdateDatoCMSItemType(server);
  registerDeleteDatoCMSItemType(server);

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