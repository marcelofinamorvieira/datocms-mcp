/**
 * Utility functions for error handling and response formatting in DatoCMS MCP tools
 */

/**
 * Utility function to check if an error is an authorization error
 */
export const isAuthorizationError = (error: unknown): boolean => {
  return (
    typeof error === 'object' && 
    error !== null && 
    ('status' in error && error.status === 401 ||
     'message' in error && typeof error.message === 'string' && 
     (error.message.includes('401') || error.message.toLowerCase().includes('unauthorized')))
  );
};

/**
 * Utility function to check if an error is a not found error
 */
export const isNotFoundError = (error: unknown): boolean => {
  return (
    typeof error === 'object' && 
    error !== null && 
    ('status' in error && error.status === 404 ||
     'message' in error && typeof error.message === 'string' && 
     (error.message.includes('404') || error.message.toLowerCase().includes('not found')))
  );
};

/**
 * Utility function to create an error response with the correct MCP content structure
 */
export const createErrorResponse = (message: string) => {
  return {
    content: [{
      type: "text" as const,
      text: message
    }]
  };
};
