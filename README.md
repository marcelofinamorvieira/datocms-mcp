# DatoCMS MCP Tools

This project provides a Model Context Protocol (MCP) server that enables Claude AI models to interact with DatoCMS. It includes tools for querying DatoCMS records and generating editor URLs for direct access to content.

## Features

- **QueryDatoCMSRecords**: Search for content in your DatoCMS project using simple text queries
- **BuildDatoCMSRecordUrl**: Generate direct links to edit specific records in the DatoCMS admin interface

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

The server runs in the foreground and will handle MCP requests from Claude. Keep this terminal window open while using Claude with this tool.

## Connecting to Claude

To connect this MCP server to Claude:

1. Open your Anthropic Claude client (e.g., Claude on web or desktop app)
2. Navigate to Settings > Model Context Protocol
3. Add a new connection with the following details:
   - **Connection Name**: DatoCMS Tools (or any name you prefer)
   - **Connection Type**: Local Process
   - **Command**: Path to the start-server.sh script
     - Example: `/path/to/your/project/start-server.sh`
   - Alternatively, you can use: `npm run start` or full path to node executable followed by the path to the built index.js file
     - Example: `/usr/local/bin/node /path/to/your/project/dist/index.js`
4. Click "Add Connection"

## Using DatoCMS Tools with Claude

Once connected, you can use the following tools in your conversation with Claude:

### QueryDatoCMSRecords

This tool searches for content in your DatoCMS project.

**Required parameters:**
- `apiToken`: Your DatoCMS API token (from DatoCMS > Project Settings > API tokens)
- `filterQuery`: Text to search for in your DatoCMS content

**Optional parameters:**
- `modelName`: Limit search to a specific content model

**Example prompt to Claude:**
```
Please search for articles about "climate change" in my DatoCMS project.
My API token is [your-api-token].
```

### BuildDatoCMSRecordUrl

This tool generates a direct link to edit a specific record in the DatoCMS admin interface.

**Required parameters:**
- `projectUrl`: Your DatoCMS project URL (e.g., https://your-project.admin.datocms.com)
- `itemTypeId`: The ID of the content model (found in the item.item_type.id property of a record)
- `itemId`: The ID of the specific record

## Troubleshooting

- If Claude cannot connect to the MCP server, ensure the server is running and the path in the Claude connection settings is correct
- For API authentication errors, verify your DatoCMS API token is valid and has the correct permissions
- If search returns no results, try using more general search terms

## License

MIT
