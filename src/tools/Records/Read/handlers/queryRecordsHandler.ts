/**
 * @file queryRecordsHandler.ts
 * @description Handler for querying DatoCMS records with filters and pagination
 * Extracted from the QueryDatoCMSRecords tool
 */

import type { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { createResponse } from "../../../../utils/responseHandlers.js";
import { isAuthorizationError, createErrorResponse } from "../../../../utils/errorHandlers.js";
import { returnMostPopulatedLocale } from "../../../../utils/returnMostPopulatedLocale.js";
import type { recordsSchemas } from "../../schemas.js";

/**
 * Handler function for querying DatoCMS records with various filters
 */
export const queryRecordsHandler = async (args: z.infer<typeof recordsSchemas.query>) => {
  const { 
    apiToken, 
    textSearch, 
    ids, 
    modelId, 
    modelName, 
    version = "current", 
    returnAllLocales = false, 
    returnOnlyIds = false,
    page,
    nested = true,
    order_by,
    fields,
    locale,
    environment
  } = args;

  try {
    // Initialize DatoCMS client
    const clientParameters = environment ? { apiToken, environment } : { apiToken };
    const client = buildClient(clientParameters);
    
    // Prepare query parameters
    const queryParams: Record<string, unknown> = {
      version,
      nested
    };
    
    // Add order_by parameter if provided with a model type filter
    if (order_by && (modelId || modelName)) {
      queryParams.order_by = order_by;
    }
    
    // Convert pagination parameters - Use sensible defaults
    const pageParams = page ? {
      limit: page.limit ?? 5,
      offset: page.offset ?? 0
    } : {
      limit: 5,
      offset: 0
    };
    
    // Add pagination parameters
    queryParams.page = pageParams;
    
    // Handle filter logic based on provided parameters
    if (textSearch) {
      // Text search query
      queryParams.filter = { query: textSearch } as Record<string, unknown>;
      if (modelName) {
        (queryParams.filter as Record<string, unknown>).type = modelName;
      }
    } else if (ids) {
      // IDs-based query
      queryParams.filter = { ids } as Record<string, unknown>;
    } else if (modelId || modelName) {
      // Model-based query with or without field filtering
      queryParams.filter = { 
        type: modelId || modelName 
      } as Record<string, unknown>;
      
      // Add field filtering if provided
      if (fields && Object.keys(fields).length > 0) {
        (queryParams.filter as Record<string, unknown>).fields = fields;
      }

      // Add locale filter if provided
      if (locale) {
        (queryParams.filter as Record<string, unknown>).locale = locale;
      }
    }
    
    try {
      const paginatedItems = await client.items.list(queryParams);

      // Return enhanced response for empty results with metadata
      if (paginatedItems.length === 0) {
        return createResponse(JSON.stringify({
          message: "No items found matching your query.",
          pagination: {
            limit: pageParams.limit,
            offset: pageParams.offset,
            total: 0,
            has_more: false
          },
          records: []
        }, null, 2));
      }
      
      // Check for meta property safely without TypeScript errors
      // The DatoCMS API response types don't always include meta in their TypeScript definitions
      const totalCount = (
        // Use type assertion to safely access meta if it exists
        'meta' in paginatedItems && 
        typeof paginatedItems.meta === 'object' && 
        paginatedItems.meta !== null && 
        'total_count' in paginatedItems.meta && 
        typeof paginatedItems.meta.total_count === 'number'
      ) ? paginatedItems.meta.total_count : paginatedItems.length;
      
      // Calculate if there might be more records
      const hasMoreRecords = paginatedItems.length === pageParams.limit && 
                          (pageParams.offset + paginatedItems.length) < totalCount;
      
      // Enhanced pagination metadata
      const paginationInfo = {
        limit: pageParams.limit,
        offset: pageParams.offset,
        total: totalCount,
        has_more: hasMoreRecords
      };
      
      // Use map approach for collecting IDs
      if (returnOnlyIds) {
        const allItemIds = paginatedItems.map(item => item.id);
        return createResponse(JSON.stringify({
          message: `Found ${allItemIds.length} record(s) matching your query.`,
          pagination: paginationInfo,
          recordIds: allItemIds
        }, null, 2));
      }
      
      // Process items to filter locales
      const allItems = paginatedItems.map(item => 
        returnMostPopulatedLocale(item, returnAllLocales)
      );
      
      // Return processed items with enhanced pagination metadata
      return createResponse(JSON.stringify({
        message: `Found ${allItems.length} record(s) matching your query.`,
        pagination: paginationInfo,
        records: allItems
      }, null, 2));
      
    } catch (apiError: unknown) {
      if (isAuthorizationError(apiError)) {
        return createErrorResponse("Error: Please provide a valid DatoCMS API token. The token you provided was rejected by the DatoCMS API.");
      }
      
      // Generic API error handling
      return createErrorResponse(`Error querying DatoCMS records: ${apiError instanceof Error ? apiError.message : String(apiError)}`);
    }
  } catch (error: unknown) {
    return createErrorResponse(`Error querying DatoCMS records: ${error instanceof Error ? error.message : String(error)}`);
  }
};
