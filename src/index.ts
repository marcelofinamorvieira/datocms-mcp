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
import {
  registerBuildDatoCMSRecordUrl,
  registerCreateScheduledPublicationOnRecord,
  registerCreateScheduledUnpublicationOnRecord,
  registerDestroyScheduledPublicationOnRecord,
  registerDestroyScheduledUnpublicationOnRecord,
  registerGetDatoCMSProjectInfo,
  registerGetDatoCMSRecordById,
  registerGetDatoCMSRecordReferences,
  registerGetDatoCMSRecordVersion,
  registerListDatoCMSRecordVersions,
  registerQueryDatoCMSRecords,
  registerRestoreDatoCMSRecordVersion,
  registerDuplicateDatoCMSRecord,
  registerDestroyDatoCMSRecord,
  registerBulkDestroyDatoCMSRecords,
  registerPublishDatoCMSRecord,
  registerBulkPublishDatoCMSRecords,
  registerUnpublishDatoCMSRecord,
  registerBulkUnpublishDatoCMSRecords,
  registerGetDatoCMSUploadById,
  registerGetDatoCMSUploadReferences,
  registerQueryDatoCMSUploads,
  registerDestroyDatoCMSUpload,
  registerBulkDestroyDatoCMSUploads,
  registerBulkTagDatoCMSUploads,
  registerBulkSetDatoCMSUploadCollection,
  registerUpdateDatoCMSUpload,
  registerCreateDatoCMSUpload,
  registerGetDatoCMSUploadCollection,
  registerQueryDatoCMSUploadCollections,
  registerCreateDatoCMSUploadCollection,
  registerUpdateDatoCMSUploadCollection,
  registerDeleteDatoCMSUploadCollection
} from "./tools/index.js";

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

  // Register tools by category
  
  // Project information tools
  // These provide metadata about the DatoCMS project configuration
  registerGetDatoCMSProjectInfo(server);

  // Record query tools
  // These allow searching and retrieving content from DatoCMS Records
  registerGetDatoCMSRecordById(server);
  registerQueryDatoCMSRecords(server);
  registerGetDatoCMSRecordReferences(server);

  // Record version tools
  // These allow querying the version history of records
  registerListDatoCMSRecordVersions(server);
  registerGetDatoCMSRecordVersion(server);
  registerRestoreDatoCMSRecordVersion(server);

  // Record creation tools
  // These allow creating new records
  registerDuplicateDatoCMSRecord(server);

  // Record deletion tools
  // These allow deleting existing records
  registerDestroyDatoCMSRecord(server);
  registerBulkDestroyDatoCMSRecords(server);

  // Publication tools
  // These tools publish and unpublish records
  registerPublishDatoCMSRecord(server);
  registerBulkPublishDatoCMSRecords(server);
  registerUnpublishDatoCMSRecord(server);
  registerBulkUnpublishDatoCMSRecords(server);

  // Publication scheduling tools
  // These manage schedulings on records, for publications and unpublications
  registerCreateScheduledPublicationOnRecord(server);
  registerDestroyScheduledPublicationOnRecord(server);
  registerCreateScheduledUnpublicationOnRecord(server);
  registerDestroyScheduledUnpublicationOnRecord(server);

  // Upload tools
  // These allow working with DatoCMS uploads (assets)
  registerGetDatoCMSUploadById(server);           // Read
  registerGetDatoCMSUploadReferences(server);     // Find references
  registerQueryDatoCMSUploads(server);            // Query/filter uploads
  registerCreateDatoCMSUpload(server);            // Create uploads
  registerDestroyDatoCMSUpload(server);           // Delete
  registerBulkDestroyDatoCMSUploads(server);      // Bulk Delete
  registerUpdateDatoCMSUpload(server);            // Update
  registerBulkTagDatoCMSUploads(server);          // Bulk Tag
  registerBulkSetDatoCMSUploadCollection(server); // Bulk Collection Assignment

  // Upload Collection tools
  // These allow working with DatoCMS upload collections (asset folders)
  registerGetDatoCMSUploadCollection(server);      // Read
  registerQueryDatoCMSUploadCollections(server);   // Query/filter collections
  registerCreateDatoCMSUploadCollection(server);   // Create collections
  registerUpdateDatoCMSUploadCollection(server);   // Update collections
  registerDeleteDatoCMSUploadCollection(server);   // Delete collections

  // Utility tools
  registerBuildDatoCMSRecordUrl(server);

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
    
    // Use stdio for communication between the server and client
    // Note: We avoid console.log in this process as it would interfere with the MCP protocol
    const transport = new StdioServerTransport();
    await server.connect(transport);
  } catch (error) {
    // Write errors to stderr to maintain protocol integrity on stdout
    console.error("Error starting MCP server:", error);
    process.exit(1);
  }
};

// Bootstrap the application
main();
