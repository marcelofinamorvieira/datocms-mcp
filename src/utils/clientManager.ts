import { buildClient, Client } from "@datocms/cma-client-node";

/**
 * Creates a DatoCMS client with the provided API token and optional environment.
 * 
 * @param apiToken The DatoCMS API token to use for authentication
 * @param environment Optional environment name to target a specific environment
 * @returns A configured DatoCMS client instance
 */
export function getClient(apiToken: string, environment?: string): Client {
  const clientParameters = environment ? { apiToken, environment } : { apiToken };
  return buildClient(clientParameters);
}