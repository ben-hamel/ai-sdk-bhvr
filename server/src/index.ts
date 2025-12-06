import { Hono } from "hono";
import { cors } from "hono/cors";
import { v1 } from "./routes";
import { auth } from "./lib/better-auth/index";

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.use(cors());

app.on(["GET", "POST"], "/api/auth/*", (c) => {
  return auth(c.env).handler(c.req.raw);
});

app.get("/", (c) => c.text("AI SDK BHVR Backend is running"));
app.route("/api/v1", v1);

export default app;
