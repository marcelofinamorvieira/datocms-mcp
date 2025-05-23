/**
 * Barrel file exporting router registration functions
 */

export * from "./Records/index.js";
export { registerProjectRouter } from "./Project/index.js";
export { registerUploadsRouter } from "./Uploads/UploadsRouterTool.js";
export { registerEnvironmentRouter } from "./Environments/index.js";
export { registerPermissionsRouter } from "./CollaboratorsRolesAndAPITokens/index.js";
export { registerCollaboratorRouter, registerRolesRouter } from "./CollaboratorsRolesAndAPITokens/index.js";
export { registerSchemaRouter } from "./Schema/index.js";
export { registerDeliveryManagementRouter } from "./WebhookAndBuildTriggerCallsAndDeploys/index.js";
export { LocalesRouterTool, registerLocalesRouter } from "./Locales/index.js";
export {
  registerUIRouter,
  // Export individual routers for backward compatibility
  registerMenuItemRouter,
  registerSchemaMenuItemRouter,
  registerUploadsFilterRouter,
  registerModelFilterRouter,
  registerPluginsRouter
} from "./UI/index.js";