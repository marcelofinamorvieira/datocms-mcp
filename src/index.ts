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
  registerGetDatoCMSProjectInfo,
  registerUpdateDatoCMSSiteSettings,
  registerGetDatoCMSUploadById,
  registerGetDatoCMSUploadReferences,
  registerQueryDatoCMSUploads,
  registerBulkDestroyDatoCMSUploads,
  registerDestroyDatoCMSUpload,
  registerListDatoCMSEnvironments,
  registerForkDatoCMSEnvironment,
  registerListDatoCMSUsagesAndSubscriptionLimits,
  registerListDatoCMSSubscriptionFeatures,
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
  registerRecordsRouter(server);     // Execute tool comes AFTER parameters

  // Project information tools
  // These provide metadata about the DatoCMS project configuration
  // registerGetDatoCMSProjectInfo(server);
  // registerUpdateDatoCMSSiteSettings(server);      // Update site settings

  // Environment tools
  // These allow retrieving and managing environment information
  // registerListDatoCMSEnvironments(server);        // List all
  // registerRetrieveDatoCMSEnvironment(server);     // Read
  // registerDeleteDatoCMSEnvironment(server);       // Delete
  // registerRenameDatoCMSEnvironment(server);       // Update
  // registerPromoteDatoCMSEnvironment(server);      // Promote
  // registerForkDatoCMSEnvironment(server);         // Fork

  // // Subscription tools
  // // These allow retrieving subscription information
  // registerListDatoCMSUsagesAndSubscriptionLimits(server);  // List usage and limits
  // registerListDatoCMSSubscriptionFeatures(server); // List available features

  // // Upload tools
  // // These allow working with DatoCMS uploads (assets)
  // registerGetDatoCMSUploadById(server);           // Read
  // registerGetDatoCMSUploadReferences(server);     // Find references
  // registerQueryDatoCMSUploads(server);            // Query/filter uploads
  // registerCreateDatoCMSUpload(server);            // Create uploads
  // registerDestroyDatoCMSUpload(server);           // Delete
  // registerBulkDestroyDatoCMSUploads(server);      // Bulk Delete
  // registerUpdateDatoCMSUpload(server);            // Update
  // registerBulkTagDatoCMSUploads(server);          // Bulk Tag
  // registerBulkSetDatoCMSUploadCollection(server); // Bulk Collection Assignment
  // registerListDatoCMSUploadTags(server);          // List Upload Tags
  // registerCreateDatoCMSUploadTag(server);         // Create Upload Tag
  // registerListDatoCMSUploadSmartTags(server);     // List Upload Smart Tags

  // // Upload Collection tools
  // // These allow working with DatoCMS upload collections (asset folders)
  // registerGetDatoCMSUploadCollection(server);      // Read
  // registerQueryDatoCMSUploadCollections(server);   // Query/filter collections
  // registerCreateDatoCMSUploadCollection(server);   // Create collections
  // registerUpdateDatoCMSUploadCollection(server);   // Update collections
  // registerDeleteDatoCMSUploadCollection(server);   // Delete collections

  // // Maintenance Mode tools
  // // These allow managing maintenance mode for the primary environment
  // registerActivateMaintenanceMode(server);
  // registerDeactivateMaintenanceMode(server);
  // registerFetchMaintenanceMode(server);

  // // Model tools
  // registerGetDatoCMSModel(server);
  // registerListDatoCMSModels(server);
  // registerDuplicateDatoCMSModel(server);
  // registerCreateDatoCMSModel(server);
  // registerUpdateDatoCMSModel(server);
  // registerDeleteDatoCMSModel(server);

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
