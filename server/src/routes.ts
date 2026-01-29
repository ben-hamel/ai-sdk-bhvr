import { Hono } from "hono";
import admin from "./modules/admin/admin.routes";
import chats from "./modules/chats/chats.routes";
import health from "./modules/health/health.routes";

type Bindings = Env;

export const v1 = new Hono<{ Bindings: Bindings }>();
v1.route("/", health);
v1.route("/admin", admin);
v1.route("/chats", chats);
