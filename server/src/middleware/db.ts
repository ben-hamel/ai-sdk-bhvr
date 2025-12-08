import type { Context, Next } from "hono";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import { createDb } from "../db";

type Bindings = {
  DATABASE_URL: string;
};

type Variables = {
  db: NeonHttpDatabase;
};

export async function dbMiddleware(
  c: Context<{ Bindings: Bindings; Variables: Variables }>,
  next: Next,
) {
  c.set("db", createDb(c.env.DATABASE_URL));
  await next();
}
