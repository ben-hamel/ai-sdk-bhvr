import { env } from "cloudflare:workers";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../../db/schema/auth";
import { betterAuthOptions } from "./options";

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const auth = () => {
  const db = drizzle(env.HYPERDRIVE.connectionString);

  return betterAuth({
    ...betterAuthOptions,
    database: drizzleAdapter(db, {
      provider: "pg",
      schema,
    }),
    databaseHooks: {
      user: {
        create: {
          before: async (user) => {
            const allowed = (env.ALLOWED_EMAILS ?? "")
              .split(",")
              .map((e: string) => e.trim())
              .filter(Boolean);
            if (!allowed.includes(user.email)) {
              return false;
            }
          },
          after: async (user) => {
            const baseSlug = toSlug(user.name);
            const slug = `${baseSlug}-${crypto.randomUUID().slice(0, 8)}`;
            const orgId = crypto.randomUUID();

            await db.insert(schema.organization).values({
              id: orgId,
              name: `${user.name}'s org`,
              slug,
              createdAt: new Date(),
            });

            await db.insert(schema.member).values({
              id: crypto.randomUUID(),
              organizationId: orgId,
              userId: user.id,
              role: "owner",
              createdAt: new Date(),
            });
          },
        },
      },
    },
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: [env.CORS_ORIGIN || ""],
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        prompt: "select_account",
      },
    },
    advanced: {
      cookies: {
        state: {
          attributes: {
            sameSite: "none",
            secure: true,
          },
        },
      },
    },
  });
};
