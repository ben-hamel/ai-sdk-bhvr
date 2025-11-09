import { Mastra } from "@mastra/core/mastra";
import { weatherAgent } from "./agents/weather-agent";
// import { PostgresStore, PgVector } from "@mastra/pg";

export const mastra = new Mastra({
  // storage: new PostgresStore({
  //   connectionString: process.env.DATABASE_URL,
  // }),
  agents: { weatherAgent },
});
