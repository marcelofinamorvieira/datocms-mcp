# DatoCMS MCP Tools

This project provides a Model Context Protocol (MCP) server that enables Claude AI models to interact with DatoCMS. It includes tools for managing DatoCMS content, collaborators, environments, projects, records, roles, API tokens, schema (item types, fieldsets, etc.), and uploads through a standardized interface.

## Features

- **Content Management**: Query, create, read, update, and delete DatoCMS records
- **Publication Management**: Publish, unpublish, and schedule content publications
- **Collaborator Management**: Manage users and roles in your DatoCMS project
- **API Token Management**: Create, retrieve, update, delete, and rotate API tokens
- **Environment Management**: Create, fork, promote, and maintain DatoCMS environments
- **Schema Management**: Manage item types (models), fieldsets, and related schema components
- **Upload Management**: Manage media assets, collections, and tags
- **Project Configuration**: Retrieve and update project settings

## Architecture

The codebase follows a modular architecture organized around domain-specific routers. This design provides a clean separation of concerns while maintaining consistency across different resource types. Related functionalities are grouped together (e.g., collaborators, roles, and API tokens) for better organization.

### Router Architecture

The server implements a router-based architecture with a uniform pattern:

1. **Router Tool**: Each domain has a main router tool that handles all operations for that resource type
   - Example: `RecordsRouterTool.ts`, `ProjectRouterTool.ts`

2. **Domain-Specific Organization**: Each router organizes operations into subdirectories by type
   - Example: `Records/Read/`, `Records/Publication/`, `Records/Delete/`, `CollaboratorsRolesAndAPITokens/Collaborators/`, `CollaboratorsRolesAndAPITokens/Roles/`

3. **Handler Implementation**: Individual operation handlers are implemented in their own files
   - Example: `getRecordByIdHandler.ts`, `publishRecordHandler.ts`

4. **Schema Validation**: Each domain defines Zod schemas for parameter validation in a `schemas.ts` file

### Router Tools

All operations are coordinated through these main router tools:

| Router Tool | Description | Examples |
|-------------|-------------|----------|
| `RecordsRouterTool` | Manages record CRUD, publication, and versioning | Query records, publish/unpublish, manage versions |
| `ProjectRouterTool` | Handles project-level operations | Get project info, update site settings |
| `EnvironmentRouterTool` | Manages DatoCMS environments | List environments, retrieve environment details |
| `CollaboratorsRolesAndAPITokensRouterTool` | Manages users, roles, invitations, and API tokens | Create/delete users, manage invitations, create/update/delete roles, create/rotate API tokens |
| `UploadsRouterTool` | Manages media assets | Query uploads, manage upload collections |
| `SchemaRouterTool` | Manages schema components | Create/read/update/delete item types and fieldsets |
| `WebhookAndBuildTriggerCallsAndDeploysRouterTool` | Manages webhooks, build triggers, deploy events, and webhook calls | Create/update/delete webhooks, list webhook calls, manage build triggers, view deploy events |

### Parameter Description System

The architecture includes a sophisticated parameter description system:

1. **Documentation Tool** (`DocumentationTool.ts`): Provides detailed parameter information
   - Exposes the `datocms_parameters` tool to Claude
   - Formats Zod schemas into user-friendly documentation

2. **Parameter-First Workflow**: 
   - Users must first call `datocms_parameters` to understand required parameters
   - Then use the appropriate router tool with the correct parameters

3. **Schema Validation**:
   - All router tools validate parameters against Zod schemas
   - Detailed error messages direct users back to the parameters tool

## WebhookAndBuildTriggerCallsAndDeploys Router Actions

The `WebhookAndBuildTriggerCallsAndDeploysRouterTool` provides comprehensive management for webhooks, build triggers, webhook calls, and deploy events:

### Webhook Actions
- **list**: List all webhooks
- **retrieve**: Get a specific webhook
- **create**: Create a new webhook
- **update**: Update an existing webhook
- **delete**: Delete a webhook

### Webhook Call Actions
- **list**: List webhook call logs for a specific webhook
- **retrieve**: Get detailed information about a webhook call
- **resend**: Resend a webhook call

### Build Trigger Actions
- **list**: List all build triggers
- **retrieve**: Get a specific build trigger
- **create**: Create a new build trigger
- **update**: Update an existing build trigger
- **delete**: Delete a build trigger
- **trigger**: Manually trigger a build

### Deploy Event Actions
- **list**: List deploy events for a specific build trigger
- **retrieve**: Get detailed information about a deploy event

## Usage Flow

1. **Get Parameters**: Call `datocms_parameters` with a resource and action
   ```json
   {
     "resource": "records",
     "action": "query"
   }
   ```

2. **Execute Action**: Call the appropriate router tool with validated parameters
   ```json
   {
     "action": "query",
     "args": {
       "apiToken": "your-api-token",
       "textSearch": "content management"
     }
   }
   ```

## Development Guidelines

When extending this codebase:

1. **Follow Router Patterns**: Add new functionality by following the existing router/handler pattern
2. **Schema Definitions**: Define parameter schemas using Zod in domain-specific schema files
3. **Handler Implementation**: Implement operation handlers in subdirectories by operation type
4. **Tool Registration**: Register new tools in `src/index.ts` within the `createServer` function

## Commands

### Build and Run

- Build the TypeScript project: `npm run build`
- Start the MCP server: `npm run start` or `./start-server.sh`
- Start the server with HTTP transport: `npm run start:http`
- Watch mode for development: `npm run dev`

## Prerequisites

- Node.js (v16+)
- npm or yarn
- A DatoCMS account and API token
- Claude AI with MCP capabilities (Claude 3 Opus/Sonnet/Haiku)

## Installation

1. Clone this repository:

```bash
git clone https://github.com/marcelofinamorvieira/datocms-mcp-tools.git
cd datocms-mcp-tools
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Build the TypeScript project:

```bash
npm run build
# or
yarn build
```

## Running the MCP Server

Start the server using the provided shell script:

```bash
./start-server.sh
```

Alternatively, you can use the npm script:

```bash
npm run start
# or
yarn start
```

## Connecting to Claude

To connect this MCP server to Claude:

1. Open your Anthropic Claude client
2. Navigate to Settings > Model Context Protocol
3. Add a new connection with the following details:
   - **Connection Name**: DatoCMS Tools (or any name you prefer)
   - **Connection Type**: Local Process
   - **Command**: Path to the start-server.sh script or `npm run start`

## License

MIT