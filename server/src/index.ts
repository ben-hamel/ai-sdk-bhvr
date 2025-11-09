import { Hono } from "hono";
import { cors } from "hono/cors";
import chats from "./modules/chats/chats.routes";
import users from "./modules/users/users.routes";
import health from "./modules/health/health.routes";

type Bindings = {
  GOOGLE_GENERATIVE_AI_API_KEY: string;
  DATABASE_URL: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use(cors());

// Mount routes
app.route("/", health);
app.route("/chats", chats);
app.route("/users", users);

export default app;
