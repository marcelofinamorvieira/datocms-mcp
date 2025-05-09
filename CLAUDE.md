# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This project is a Model Context Protocol (MCP) server that enables Claude AI models to interact with DatoCMS. It provides tools for querying DatoCMS records, managing content publication, generating editor URLs, and other content management operations through a standardized interface.

## Commands

### Build and Run

- Build the TypeScript project: `npm run build`
- Start the MCP server: `npm run start` or `./start-server.sh`
- Start the server with HTTP transport: `npm run start:http`
- Watch mode for development: `npm run dev`

### Project Structure

The codebase follows a modular architecture organized by domain:

- `src/index.ts` - Entry point that initializes the MCP server
- `src/tools/` - Contains all MCP tools organized by domain
  - `Records/` - Tools for record CRUD operations
  - `Model/` - Tools for model operations
  - `Project/` - Project configuration tools
  - `Uploads/` - Media asset management tools
  - `Environments/` - Environment management tools

## Architecture

### Core Components

1. **MCP Server** - Uses `@modelcontextprotocol/sdk` to handle communication between Claude and DatoCMS
2. **Router Tools** - Organize related tools into domain-specific routers:
   - `RecordsRouterTool` - Handles record operations
   - `ProjectRouterTool` - Manages project settings
   - `UploadsRouterTool` - Controls media assets

### Key Design Patterns

1. **Router Pattern** - Domain-specific router tools group related functionality
   - Example: `src/tools/Records/RecordsRouterTool.ts` routes record operations to appropriate handlers

2. **Handler Pattern** - Implementations are separated into handler functions
   - Example: `src/tools/Records/Read/handlers/` contains specific record read operation handlers

3. **Schema Validation** - Uses Zod for input validation
   - Schemas defined in domain-specific schema files (e.g., `schemas.ts`)

### Communication Flow

1. Claude sends a tool request to the MCP server
2. The server routes the request to the appropriate domain router
3. The router delegates to specific handlers
4. Handlers interact with the DatoCMS API via `@datocms/cma-client-node`
5. Results are returned to Claude through the MCP protocol

## Development Guidelines

When modifying or extending this codebase:

1. Follow the existing router/handler pattern for organizing new tools
2. Create appropriate Zod schemas for parameter validation in domain-specific schema files
3. Implement error handling using the utility functions in `src/utils/errorHandlers.ts`
4. Register new tools in `src/index.ts` within the `createServer` function

## API Client

The project uses `@datocms/cma-client-node` to interact with the DatoCMS Content Management API. Refer to the [DatoCMS CMA documentation](https://www.datocms.com/docs/content-management-api) for API details.