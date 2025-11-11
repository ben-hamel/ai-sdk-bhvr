import type { Context, Next } from "hono";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { createDb } from "../db";

type Bindings = {
  DATABASE_URL: string;
};

type Variables = {
  db: NodePgDatabase;
};

/**
 * Middleware that creates a database instance and attaches it to the context.
 * Each request gets its own db instance, following Cloudflare Workers best practices.
 */
export async function dbMiddleware(
  c: Context<{ Bindings: Bindings; Variables: Variables }>,
  next: Next,
) {
  c.set("db", createDb(c.env.DATABASE_URL));
  await next();
}
