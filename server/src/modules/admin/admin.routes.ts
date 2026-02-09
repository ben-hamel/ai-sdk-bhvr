import { Hono } from "hono";
import { auth } from "../../lib/better-auth/index";

const isAdminRole = (role?: string | string[] | null) => {
  if (!role) return false;
  if (Array.isArray(role)) return role.includes("admin");
  return role
    .split(",")
    .map((value) => value.trim())
    .includes("admin");
};

const admin = new Hono<{ Bindings: Env }>();

admin.use("*", async (c, next) => {
  const session = await auth().api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session) {
    return c.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAdminRole(session.user?.role)) {
    return c.json({ error: "Forbidden" }, { status: 403 });
  }

  await next();
});

admin.get("/", (c) => {
  return c.json({ ok: true });
});

export default admin;
