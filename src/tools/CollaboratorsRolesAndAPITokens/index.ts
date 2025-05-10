/**
 * Barrel file exporting collaborators, roles, and API tokens modules
 */

// Export the router tool
export { registerPermissionsRouter } from './CollaboratorsRolesAndAPITokensRouterTool.js';

// Export specific router functions for backward compatibility if needed
export { registerCollaboratorRouter, registerRolesRouter } from './CollaboratorsRolesAndAPITokensRouterTool.js';

// Re-export from submodules
export * from './Collaborators/index.js';
export * from './Roles/index.js';