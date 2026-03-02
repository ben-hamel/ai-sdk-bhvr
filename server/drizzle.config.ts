import "dotenv/config";
import { defineConfig } from "drizzle-kit";


export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema/*",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE || "",
  },
  tablesFilter: ["!mastra_*", "!memory_*"],
});
