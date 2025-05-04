import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

// Define the Text Block type to avoid dependency on MCP types
type TextBlock = {
  type: "text";
  text: string;
};

// Define Response type structure
type Response = {
  content: TextBlock[];
};

/**
 * Maximum character length for a single MCP response block to avoid truncation
 * The MCP reference protocol caps each response at 100,000 UTF-8 characters
 */
const MAX_RESPONSE_LENGTH = 100000; 

/**
 * Splits large text responses into smaller chunks that stay within MCP size limits
 * @param text The text content to be chunked
 * @returns An array of text block chunks that conform to MCP size limits
 */
export const chunkTextResponse = (text: string): TextBlock[] => {
  // If text is small enough, return it as a single block
  if (text.length <= MAX_RESPONSE_LENGTH) {
    return [{ type: "text" as const, text }];
  }

  // Split the text into chunks
  const chunks: TextBlock[] = [];
  
  // Use regex to split the text into chunks of appropriate size
  // The regex matches up to MAX_RESPONSE_LENGTH characters
  const textChunks = text.match(new RegExp(`.{1,${MAX_RESPONSE_LENGTH}}`, "gs")) || [];
  
  // Convert each text chunk to a proper MCP TextBlock
  for (const chunk of textChunks) {
    chunks.push({ type: "text" as const, text: chunk });
  }

  return chunks;
};

/**
 * Creates an MCP response, automatically chunking if the text exceeds size limits
 * Only chunks the response if necessary (text > 100k characters)
 * @param text The text to include in the response
 * @returns An MCP response object with properly sized content blocks
 */
export const createResponse = (text: string): Response => {
  return {
    content: chunkTextResponse(text)
  };
};
