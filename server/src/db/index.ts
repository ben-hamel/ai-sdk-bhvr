import { drizzle } from "drizzle-orm/node-postgres";

/**
 * Creates a new database connection instance.
 * In Cloudflare Workers, you should create a new connection per request
 * using the DATABASE_URL from environment bindings.
 */
export function createDb(databaseUrl: string) {
  return drizzle(databaseUrl);
}
