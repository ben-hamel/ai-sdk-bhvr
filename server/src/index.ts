import { Hono } from "hono";
import { cors } from "hono/cors";
import { v1 } from "./routes";

type Bindings = {
  GOOGLE_GENERATIVE_AI_API_KEY: string;
  DATABASE_URL: string;
};

const app = new Hono<{ Bindings: Bindings }>().basePath("/api");

app.use(cors());

app.route("/v1", v1);
export default app;
