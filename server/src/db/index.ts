import { env } from "cloudflare:workers";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";

export type AppDb = NodePgDatabase<Record<string, never>>;

export async function createDb(databaseUrl: string): Promise<AppDb> {
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  return drizzle(client);
}

export const db = drizzle(env.HYPERDRIVE.connectionString);

// const pool = new Pool({
//   connectionString: process.env.DATABASE_URL,
// });

// export const db = drizzle({ client: pool });
