import { Hono } from "hono";
import chats from "./modules/chats/chats.routes";
import users from "./modules/users/users.routes";

type Bindings = {
  GOOGLE_GENERATIVE_AI_API_KEY: string;
  DATABASE_URL: string;
};

export const v1 = new Hono<{ Bindings: Bindings }>();
v1.route("/chats", chats);
v1.route("/users", users);
