import { env } from "cloudflare:workers";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { auth } from "./lib/better-auth/index";
import { v1 } from "./routes";

const app = new Hono<{ Bindings: Env }>();

app.use(
  "/*",
  cors({
    origin: env.CORS_ORIGIN,
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);
app.on(["POST", "GET"], "/api/auth/*", (c) => auth().handler(c.req.raw));

app.get("/", (c) => c.text("AI SDK BHVR Backend is running"));
app.route("/api/v1", v1);

export default app;
