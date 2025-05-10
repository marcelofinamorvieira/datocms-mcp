# DatoCMS MCP Tools

This project provides a Model Context Protocol (MCP) server that enables Claude AI models to interact with DatoCMS. It includes tools for managing DatoCMS content, collaborators, environments, fieldsets, item types, projects, records, roles, and uploads through a standardized interface.

## Features

- **Content Management**: Query, create, read, update, and delete DatoCMS records
- **Publication Management**: Publish, unpublish, and schedule content publications
- **Collaborator Management**: Manage users and roles in your DatoCMS project
- **Environment Management**: Create, fork, promote, and maintain DatoCMS environments
- **Fieldset Management**: Create, read, update, and delete fieldsets for organizing fields
- **Upload Management**: Manage media assets, collections, and tags
- **Project Configuration**: Retrieve and update project settings
- **Item Type Operations**: Create, read, update, and duplicate content item types

## Architecture

The codebase follows a modular architecture organized around domain-specific routers. This design provides a clean separation of concerns while maintaining consistency across different resource types.

### Router Architecture

The server implements a router-based architecture with a uniform pattern:

1. **Router Tool**: Each domain has a main router tool that handles all operations for that resource type
   - Example: `RecordsRouterTool.ts`, `ProjectRouterTool.ts`

2. **Domain-Specific Organization**: Each router organizes operations into subdirectories by type
   - Example: `Records/Read/`, `Records/Publication/`, `Records/Delete/`

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
| `CollaboratorsRouterTool` | Manages users and invitations | Create/delete users, manage invitations |
| `RolesRouterTool` | Manages user roles and permissions | Create/update/delete roles |
| `UploadsRouterTool` | Manages media assets | Query uploads, manage upload collections |
| `ItemType` | Manages item type operations | Create/read/update/delete/duplicate item types |
| `FieldsetRouterTool` | Manages fieldsets for organizing fields | Create/read/update/delete fieldsets |

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