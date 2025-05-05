# DatoCMS MCP Tools

This project provides a Model Context Protocol (MCP) server that enables Claude AI models to interact with DatoCMS. It includes tools for querying DatoCMS records, managing content publication, and generating editor URLs for direct access to content.

## Features

- **Query DatoCMS Content**: Search for records with text queries and retrieve specific records by ID
- **Content Publication Management**: Schedule or cancel content publications and unpublications
- **Record References**: Find records that link to a specific record
- **Project Information**: Retrieve metadata about your DatoCMS project
- **Editor URLs**: Generate direct links to edit specific records in the DatoCMS admin interface
- **Version Management**: List, retrieve, and restore record versions
- **Record Management**: Create duplicate records and delete existing records
- **Publication Control**: Publish and unpublish records individually or in bulk
- **Bulk Operations**: Perform actions on multiple records at once, such as publishing, unpublishing, and deletion
- **Upload Management**: Retrieve, delete, tag, and organize DatoCMS uploads/assets

## Tools Overview

### Record Read Operations

| Tool | Description | Parameters | Returns | 
|------|-------------|------------|---------|  
| QueryDatoCMSRecords | Universal query tool for DatoCMS records. Can search by text query, fetch records by IDs, or get all records from a model. Supports pagination and locale handling. | `apiToken`, `filterQuery` (optional), `ids` (optional), `modelId` (optional), `modelName` (optional), `fields` (optional), `locale` (optional), `order_by` (optional), `version` (optional), `returnAllLocales` (optional), `returnOnlyIds` (optional), `limit` (optional), `offset` (optional), `nested` (optional) | Array of matching records or record IDs |
| GetDatoCMSRecordById | Retrieves a specific record by its ID | `apiToken`, `itemId`, `version` (optional), `returnAllLocales` (optional) | Single record object |
| BuildDatoCMSRecordUrl | Generates a direct editor URL for a specific record | `projectUrl`, `itemTypeId`, `itemId` | URL to edit the record |
| GetDatoCMSRecordReferences | Finds records that link to a specific record | `apiToken`, `itemId`, `returnAllLocales` (optional) | Array of referencing records |

### Record Create Operations

| Tool | Description | Parameters | Returns | 
|------|-------------|------------|-------|
| DuplicateDatoCMSRecord | Creates a duplicate of an existing DatoCMS record | `apiToken`, `itemId`, `returnOnlyConfirmation` (optional) | Newly created record or confirmation message |

### Record Delete Operations

| Tool | Description | Parameters | Returns | 
|------|-------------|------------|-------|
| DestroyDatoCMSRecord | Permanently deletes a DatoCMS record | `apiToken`, `itemId`, `confirmation`, `returnOnlyConfirmation` (optional) | Deleted record data or confirmation message |
| BulkDestroyDatoCMSRecords | Permanently deletes multiple DatoCMS records at once | `apiToken`, `itemIds`, `confirmation` | Confirmation message with count of deleted records |

### Record Version Operations

| Tool | Description | Parameters | Returns | 
|------|-------------|------------|-------|
| ListDatoCMSRecordVersions | Lists all versions of a specific DatoCMS record | `apiToken`, `recordId`, `returnOnlyIds` (optional), `limit` (optional), `offset` (optional), `nested` (optional) | Array of version IDs or version objects |
| GetDatoCMSRecordVersion | Retrieves a specific version of a DatoCMS record | `apiToken`, `versionId` | Single version object |
| RestoreDatoCMSRecordVersion | Restores a record to a previous version state | `apiToken`, `versionId` | Restored version object |

### Publication Management Operations

| Tool | Description | Parameters | Returns | 
|------|-------------|------------|-------|
| PublishDatoCMSRecord | Publishes a single DatoCMS record | `apiToken`, `itemId`, `content_in_locales` (optional), `recursive` (optional) | Published record object |
| UnpublishDatoCMSRecord | Unpublishes a single DatoCMS record | `apiToken`, `itemId`, `content_in_locales` (optional), `recursive` (optional) | Unpublished record object |
| BulkPublishDatoCMSRecords | Publishes multiple DatoCMS records at once | `apiToken`, `itemIds` | Confirmation message with count of published records |
| BulkUnpublishDatoCMSRecords | Unpublishes multiple DatoCMS records at once | `apiToken`, `itemIds` | Confirmation message with count of unpublished records |
| CreateScheduledPublicationOnRecord | Schedules a record to be published at a specific time | `apiToken`, `itemId`, `publicationDate` | Scheduled publication object |
| DestroyScheduledPublicationOnRecord | Cancels a scheduled publication | `apiToken`, `itemId` | Confirmation message |
| CreateScheduledUnpublicationOnRecord | Schedules a record to be unpublished at a specific time | `apiToken`, `itemId`, `unpublicationDate` | Scheduled unpublication object |
| DestroyScheduledUnpublicationOnRecord | Cancels a scheduled unpublication | `apiToken`, `itemId` | Confirmation message |

### Upload Operations

| Tool | Description | Parameters | Returns | 
|------|-------------|------------|-------|
| GetDatoCMSUploadById | Retrieves a specific DatoCMS upload by its ID | `apiToken`, `uploadId` | Upload resource object |
| UpdateDatoCMSUpload | Updates a DatoCMS upload's metadata, renames it, or uploads a new version | `apiToken`, `uploadId`, `path` (optional), `basename` (optional), `copyright` (optional), `author` (optional), `notes` (optional), `tags` (optional), `default_field_metadata` (optional), `upload_collection` (optional) | Updated upload resource object |
| DestroyDatoCMSUpload | Permanently deletes a DatoCMS upload | `apiToken`, `uploadId`, `confirmation`, `returnOnlyConfirmation` (optional) | Deleted upload data or confirmation message |
| BulkDestroyDatoCMSUploads | Permanently deletes multiple DatoCMS uploads at once | `apiToken`, `uploadIds`, `confirmation` | Confirmation message with count of deleted uploads |
| BulkTagDatoCMSUploads | Adds specified tags to multiple DatoCMS uploads | `apiToken`, `uploadIds`, `tags` | Confirmation message with count of tagged uploads |
| BulkSetDatoCMSUploadCollection | Assigns multiple DatoCMS uploads to a collection or removes them from collections | `apiToken`, `uploadIds`, `collectionId` | Confirmation message with count of updated uploads |

### Project Operations

| Tool | Description | Parameters | Returns | 
|------|-------------|------------|-------|
| GetDatoCMSProjectInfo | Retrieves information about the DatoCMS project | `apiToken` | Project configuration object |

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

Once connected, you can use the tools described in the table above.

Here's an example conversation using the DatoCMS tools:

```
User: I need to find content in my DatoCMS project about "artificial intelligence". My API token is [your-api-token].

Claude: I'll search for content related to artificial intelligence in your DatoCMS project.
[Claude uses QueryDatoCMSRecords tool]

I found 3 items matching your search:
1. "Introduction to AI" - Blog post (ID: 12345)
2. "Machine Learning Basics" - Tutorial (ID: 67890)
3. "AI Ethics Guidelines" - Page (ID: 54321)

Would you like more details about any of these items?

User: Yes, can you get me the details of the AI Ethics Guidelines page?

Claude: I'll retrieve the details for the AI Ethics Guidelines page.
[Claude uses GetDatoCMSRecordById tool with the remembered API token]

Here are the details for "AI Ethics Guidelines":
[Content details provided]

Would you like to schedule this content to be published at a specific time?

User: Yes, please schedule it for tomorrow at 9:00 AM UTC.

Claude: I'll set up the scheduled publication for you.
[Claude uses CreateScheduledPublicationOnRecord tool with the remembered API token]

Success! The "AI Ethics Guidelines" page has been scheduled for publication tomorrow at 9:00 AM UTC.

User: Thanks! Can you also give me the URL to edit this page in the DatoCMS admin interface?

Claude: I'll generate that URL for you.
[Claude uses BuildDatoCMSRecordUrl tool]

Here's the direct link to edit this page in your DatoCMS admin interface:
[Editor URL provided]
```

## Troubleshooting

- If Claude cannot connect to the MCP server, ensure the server is running and the path in the Claude connection settings is correct
- For API authentication errors, verify your DatoCMS API token is valid and has the correct permissions
- If search returns no results, try using more general search terms

## License

MIT
