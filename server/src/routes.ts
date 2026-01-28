import { Hono } from "hono";
import chats from "./modules/chats/chats.routes";
import health from "./modules/health/health.routes";

type Bindings = Env;

export const v1 = new Hono<{ Bindings: Bindings }>();
v1.route("/", health);
v1.route("/chats", chats);
