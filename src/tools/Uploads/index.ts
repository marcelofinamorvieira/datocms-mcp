import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerGetDatoCMSUploadById } from "./Read/index.js";
import { registerDestroyDatoCMSUpload, registerBulkDestroyDatoCMSUploads } from "./Delete/index.js";
import { registerBulkTagDatoCMSUploads, registerBulkSetDatoCMSUploadCollection } from "./Update/index.js";

export const registerUploadsTools = (server: McpServer) => {
  // Register Read tools
  registerGetDatoCMSUploadById(server);
  
  // Register Delete tools
  registerDestroyDatoCMSUpload(server);
  registerBulkDestroyDatoCMSUploads(server);

  // Register Update tools
  registerBulkTagDatoCMSUploads(server);
  registerBulkSetDatoCMSUploadCollection(server);
};
