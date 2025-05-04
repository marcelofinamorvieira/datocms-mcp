# DatoCMS MCP Tools

This project provides a Model Context Protocol (MCP) server that enables Claude AI models to interact with DatoCMS. It includes tools for querying DatoCMS records, managing content publication, and generating editor URLs for direct access to content.

## Features

- **Query DatoCMS Content**: Search for records with text queries and retrieve specific records by ID
- **Content Publication Management**: Schedule or cancel content publications and unpublications
- **Record References**: Find records that link to a specific record
- **Project Information**: Retrieve metadata about your DatoCMS project
- **Editor URLs**: Generate direct links to edit specific records in the DatoCMS admin interface

## Tools Overview

| Tool | Description | Parameters | Returns | 
|------|-------------|------------|---------|
| 🔍 QueryDatoCMSRecordsByString | Searches for content across your DatoCMS project using text queries | `apiToken`, `filterQuery`, `modelName` (optional), `version` (optional), `returnAllLocales` (optional) | Array of matching records |
| 📋 GetDatoCMSRecordById | Retrieves a specific record by its ID | `apiToken`, `itemId`, `version` (optional), `returnAllLocales` (optional) | Single record object |
| 🔗 BuildDatoCMSRecordUrl | Generates a direct editor URL for a specific record | `projectUrl`, `itemTypeId`, `itemId` | URL to edit the record |
| 📊 GetDatoCMSProjectInfo | Retrieves information about the DatoCMS project | `apiToken` | Project configuration object |
| 🔄 GetDatoCMSRecordReferences | Finds records that link to a specific record | `apiToken`, `itemId`, `returnAllLocales` (optional) | Array of referencing records |
| 📅 CreateScheduledPublicationOnRecord | Schedules a record to be published at a specific time | `apiToken`, `itemId`, `publicationDate` | Scheduled publication object |
| 🗑️ DestroyScheduledPublicationOnRecord | Cancels a scheduled publication | `apiToken`, `itemId` | Confirmation message |
| 📆 CreateScheduledUnpublicationOnRecord | Schedules a record to be unpublished at a specific time | `apiToken`, `itemId`, `unpublicationDate` | Scheduled unpublication object |
| 🗑️ DestroyScheduledUnpublicationOnRecord | Cancels a scheduled unpublication | `apiToken`, `itemId` | Confirmation message |

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

Once connected, you can use the tools described in the table above. Here are some example prompts:

### Searching for content

```
Please search for blog posts about "artificial intelligence" in my DatoCMS project.
My API token is [your-api-token].
```

### Getting a specific record

```
Can you retrieve the DatoCMS record with ID "123456" for me?
My API token is [your-api-token].
```

### Scheduling a publication

```
I need to schedule the publication of content with ID "123456" for tomorrow at 9:00 AM UTC.
My API token is [your-api-token].
```

## Troubleshooting

- If Claude cannot connect to the MCP server, ensure the server is running and the path in the Claude connection settings is correct
- For API authentication errors, verify your DatoCMS API token is valid and has the correct permissions
- If search returns no results, try using more general search terms

## License

MIT
