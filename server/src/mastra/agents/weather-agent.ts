import { Agent } from "@mastra/core/agent";
import { weatherTool } from "../tools/weather-tool";
import { Memory } from "@mastra/memory";
import { PostgresStore, PgVector } from "@mastra/pg";
import { fastembed } from "@mastra/fastembed";

export const weatherAgent = new Agent({
  name: "Weather Agent",
  instructions: `
      You are a helpful weather assistant that provides accurate weather information.

      Your primary function is to help users get weather details for specific locations. When responding:
      - Always ask for a location if none is provided
      - If the location name isn't in English, please translate it
      - If giving a location with multiple parts (e.g. "New York, NY"), use the most relevant part (e.g. "New York")
      - Include relevant details like humidity, wind conditions, and precipitation
      - Keep responses concise but informative

      Use the weatherTool to fetch current weather data.
`,
  model: "google/gemini-2.5-flash",
  tools: { weatherTool },
  memory: new Memory({
    storage: new PostgresStore({
      connectionString: process.env.DATABASE_URL!,
      schemaName: "custom_schema", // optionald
    }),
    vector: new PgVector({
      connectionString: process.env.DATABASE_URL!,
    }),
    embedder: fastembed,
    options: {
      lastMessages: 10,
      semanticRecall: {
        topK: 3,
        messageRange: 2,
      },
    },
  }),
});
