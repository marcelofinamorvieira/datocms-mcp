/**
 * Barrel file exporting all tool registration functions
 */

// Import all tools from the Records directory
// This includes Read, Versions, PublicationScheduling, Creation, Deletion, and Publication tools
export * from './Records/index.js';

// Import all tools from the Project directory
export * from './Project/index.js';

// Import all tools from the UploadCollections directory
export * from './UploadCollections/index.js';

// Import all tools from the Environments directory
export * from './Environments/index.js';

// Import the Maintenance Mode tools explicitly to avoid issues with spaces in folder names
export { registerActivateMaintenanceMode } from "./Maintenence Mode/Activate/ActivateMaintenanceMode.js";
export { registerDeactivateMaintenanceMode } from "./Maintenence Mode/Deactivate/DeactivateMaintenanceMode.js";
export { registerFetchMaintenanceMode } from "./Maintenence Mode/Fetch/FetchMaintenanceMode.js";

// Export Upload tools individually
export { registerGetDatoCMSUploadById, registerGetDatoCMSUploadReferences, registerQueryDatoCMSUploads } from './Uploads/Read/index.js';
export { registerDestroyDatoCMSUpload, registerBulkDestroyDatoCMSUploads } from './Uploads/Delete/index.js';
export { registerBulkTagDatoCMSUploads, registerBulkSetDatoCMSUploadCollection, registerUpdateDatoCMSUpload } from './Uploads/Update/index.js';
export { registerCreateDatoCMSUpload } from './Uploads/Create/index.js';
