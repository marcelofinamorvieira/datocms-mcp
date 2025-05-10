import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  webhookActionsList,
  webhookSchemas,
  webhookCallActionsList,
  webhookCallSchemas,
  buildTriggerActionsList,
  buildTriggerSchemas,
  deployEventActionsList,
  deployEventSchemas
} from "./schemas.js";

// Import webhook handlers
import { listWebhooksHandler } from "./Webhooks/Read/handlers/index.js";
import { retrieveWebhookHandler } from "./Webhooks/Read/handlers/index.js";
import { createWebhookHandler } from "./Webhooks/Create/handlers/index.js";
import { updateWebhookHandler } from "./Webhooks/Update/handlers/index.js";
import { deleteWebhookHandler } from "./Webhooks/Delete/handlers/index.js";

// Import webhook call handlers
import { listWebhookCallsHandler } from "./WebhookCalls/List/handlers/index.js";
import { retrieveWebhookCallHandler } from "./WebhookCalls/Retrieve/handlers/index.js";
import { resendWebhookCallHandler } from "./WebhookCalls/Resend/handlers/index.js";

// Import build trigger handlers
import { listBuildTriggersHandler } from "./BuildTriggers/List/handlers/index.js";
import { retrieveBuildTriggerHandler } from "./BuildTriggers/Retrieve/handlers/index.js";
import { createBuildTriggerHandler } from "./BuildTriggers/Create/handlers/index.js";
import { updateBuildTriggerHandler } from "./BuildTriggers/Update/handlers/index.js";
import { deleteBuildTriggerHandler } from "./BuildTriggers/Delete/handlers/index.js";
import { triggerBuildHandler } from "./BuildTriggers/Trigger/handlers/index.js";

// Import deploy event handlers
import { listDeployEventsHandler } from "./DeployEvents/List/handlers/index.js";
import { retrieveDeployEventHandler } from "./DeployEvents/Retrieve/handlers/index.js";

import { createErrorResponse } from "../../utils/errorHandlers.js";

// Types for the action parameters
type WebhookAction = keyof typeof webhookSchemas;
type WebhookCallAction = keyof typeof webhookCallSchemas;
type BuildTriggerAction = keyof typeof buildTriggerSchemas;
type DeployEventAction = keyof typeof deployEventSchemas;

// Type for tool arguments
type DeliveryToolArgs = {
  action: string;
  args?: Record<string, unknown>;
};

// Type map for webhook action arguments
type WebhookArgsMap = {
  list: z.infer<typeof webhookSchemas.list>;
  retrieve: z.infer<typeof webhookSchemas.retrieve>;
  create: z.infer<typeof webhookSchemas.create>;
  update: z.infer<typeof webhookSchemas.update>;
  delete: z.infer<typeof webhookSchemas.delete>;
};

// Type map for webhook call action arguments
type WebhookCallArgsMap = {
  list: z.infer<typeof webhookCallSchemas.list>;
  retrieve: z.infer<typeof webhookCallSchemas.retrieve>;
  resend: z.infer<typeof webhookCallSchemas.resend>;
};

// Type map for build trigger action arguments
type BuildTriggerArgsMap = {
  list: z.infer<typeof buildTriggerSchemas.list>;
  retrieve: z.infer<typeof buildTriggerSchemas.retrieve>;
  create: z.infer<typeof buildTriggerSchemas.create>;
  update: z.infer<typeof buildTriggerSchemas.update>;
  delete: z.infer<typeof buildTriggerSchemas.delete>;
  trigger: z.infer<typeof buildTriggerSchemas.trigger>;
  abort: z.infer<typeof buildTriggerSchemas.abort>;
  abortIndexing: z.infer<typeof buildTriggerSchemas.abortIndexing>;
  reindex: z.infer<typeof buildTriggerSchemas.reindex>;
};

// Type map for deploy event action arguments
type DeployEventArgsMap = {
  list: z.infer<typeof deployEventSchemas.list>;
  retrieve: z.infer<typeof deployEventSchemas.retrieve>;
};

/**
 * Registers the Webhook and Build Trigger Calls And Deploys Router tool with the MCP server
 */
export const registerDeliveryManagementRouter = (server: McpServer) => {
  const actionEnum = z.enum(webhookActionsList as [string, ...string[]]);
  
  // Combine all actions into a single enum for the tool
  const allActions = [...webhookActionsList, ...webhookCallActionsList, ...buildTriggerActionsList, ...deployEventActionsList];
  const combinedActionEnum = z.enum([...allActions] as [string, ...string[]]);

  server.tool(
    // Tool name
    "datocms_webhook_and_build_triggers",
    // Parameter schema
    {
      action: combinedActionEnum,
      args: z.record(z.any()).optional().describe("Arguments for the action to perform. Required parameters depend on the action."),
    },
    // Annotations for the tool
    {
      title: "DatoCMS Webhook and Build Triggers",
      description: "Manages DatoCMS webhooks, webhook activity, build triggers, and deploy activity."
    },
    // Handler function
    async ({ action, args = {} }) => {
      try {
        // Check which type of action this is (webhook, webhook call, build trigger, or deploy event)
        const isWebhookAction = webhookActionsList.includes(action as any);
        const isWebhookCallAction = webhookCallActionsList.includes(action as any);
        const isBuildTriggerAction = buildTriggerActionsList.includes(action as any);
        const isDeployEventAction = deployEventActionsList.includes(action as any);

        if (!isWebhookAction && !isWebhookCallAction && !isBuildTriggerAction && !isDeployEventAction) {
          return createErrorResponse(
            `Invalid action '${action}'. Supported actions: ${allActions.join(", ")}`
          );
        }

        // Get appropriate schema for the action
        let schema;
        if (isWebhookAction) {
          schema = webhookSchemas[action as WebhookAction];
        } else if (isWebhookCallAction) {
          schema = webhookCallSchemas[action as WebhookCallAction];
        } else if (isBuildTriggerAction) {
          schema = buildTriggerSchemas[action as BuildTriggerAction];
        } else {
          schema = deployEventSchemas[action as DeployEventAction];
        }

        // Validate parameters for the given action
        try {
          const validatedParams = schema.parse(args);

          // Route to the appropriate handler based on the action
          // Webhook Actions
          if (isWebhookAction) {
            switch (action) {
              case "list":
                return await listWebhooksHandler(validatedParams as WebhookArgsMap["list"]);
              case "retrieve":
                return await retrieveWebhookHandler(validatedParams as WebhookArgsMap["retrieve"]);
              case "create":
                return await createWebhookHandler(validatedParams as WebhookArgsMap["create"]);
              case "update":
                return await updateWebhookHandler(validatedParams as WebhookArgsMap["update"]);
              case "delete":
                return await deleteWebhookHandler(validatedParams as WebhookArgsMap["delete"]);
            }
          }

          // Webhook Call Actions
          if (isWebhookCallAction) {
            switch (action) {
              case "list":
                return await listWebhookCallsHandler(validatedParams as WebhookCallArgsMap["list"]);
              case "retrieve":
                return await retrieveWebhookCallHandler(validatedParams as WebhookCallArgsMap["retrieve"]);
              case "resend":
                return await resendWebhookCallHandler(validatedParams as WebhookCallArgsMap["resend"]);
            }
          }

          // Build Trigger Actions
          if (isBuildTriggerAction) {
            switch (action) {
              case "list":
                return await listBuildTriggersHandler(validatedParams as BuildTriggerArgsMap["list"]);
              case "retrieve":
                return await retrieveBuildTriggerHandler(validatedParams as BuildTriggerArgsMap["retrieve"]);
              case "create":
                return await createBuildTriggerHandler(validatedParams as BuildTriggerArgsMap["create"]);
              case "update":
                return await updateBuildTriggerHandler(validatedParams as BuildTriggerArgsMap["update"]);
              case "delete":
                return await deleteBuildTriggerHandler(validatedParams as BuildTriggerArgsMap["delete"]);
              case "trigger":
                return await triggerBuildHandler(validatedParams as BuildTriggerArgsMap["trigger"]);
              case "abort":
              case "abortIndexing":
              case "reindex":
                return createErrorResponse(
                  `Action '${action}' is not yet implemented but will be available soon.`
                );
            }
          }

          // Deploy Event Actions
          if (isDeployEventAction) {
            switch (action) {
              case "list":
                return await listDeployEventsHandler(validatedParams as DeployEventArgsMap["list"]);
              case "retrieve":
                return await retrieveDeployEventHandler(validatedParams as DeployEventArgsMap["retrieve"]);
            }
          }

          return createErrorResponse(
            `Action '${action}' is not yet implemented.`
          );
        } catch (validationError) {
          // Handle validation errors
          if (validationError instanceof z.ZodError) {
            const errorFormatted = validationError.errors
              .map(e => `- ${e.path.join(".")}: ${e.message}`)
              .join("\n");
            
            return createErrorResponse(
              `Invalid parameters for '${action}' action:\n${errorFormatted}`
            );
          }
          
          // Handle other errors
          return createErrorResponse(
            `Error validating arguments: ${validationError instanceof Error ? validationError.message : String(validationError)}`
          );
        }
      } catch (error) {
        // Handle other errors
        return createErrorResponse(
          `Error in Delivery Management Router: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );
};