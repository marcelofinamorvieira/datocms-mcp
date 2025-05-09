import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { actionEnum, schemas } from "./schemas.js";
import { createRoleHandler } from "./Create/handlers/index.js";
import { listRolesHandler } from "./Read/handlers/index.js";
import { retrieveRoleHandler } from "./Read/handlers/index.js";
import { updateRoleHandler } from "./Update/handlers/index.js";
import { destroyRoleHandler } from "./Delete/handlers/index.js";
import { createErrorResponse } from "../../utils/errorHandlers.js";

/**
 * Register the Roles router with the MCP server
 */
export const registerRolesRouter = (server: McpServer) => {
  server.tool(
    "datocms_roles",
    {
      action: actionEnum,
      args: z.record(z.any()).optional().describe("Arguments for the action to perform.")
    },
    {
      title: "DatoCMS Role Operations",
      description: "Executes DatoCMS role-related operations with the specified parameters."
    },
    async ({ action, args = {} }) => {
      try {
        // Validate input parameters based on the action
        const schema = schemas[action as keyof typeof schemas];
        const params = schema.parse(args);

        // Route to the appropriate handler
        switch (action) {
          case "create_role":
            return await createRoleHandler(params as z.infer<typeof schemas.create_role>);
          case "list_roles":
            return await listRolesHandler(params as z.infer<typeof schemas.list_roles>);
          case "retrieve_role":
            return await retrieveRoleHandler(params as z.infer<typeof schemas.retrieve_role>);
          case "update_role":
            return await updateRoleHandler(params as z.infer<typeof schemas.update_role>);
          case "destroy_role":
            return await destroyRoleHandler(params as z.infer<typeof schemas.destroy_role>);
          default:
            throw new Error(`Unsupported action: ${action}`);
        }
      } catch (error) {
        return createErrorResponse(`Error performing role operation: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );
};