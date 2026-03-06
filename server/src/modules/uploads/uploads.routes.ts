import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Hono } from "hono";
import { z } from "zod";
import { auth } from "../../lib/better-auth/index";

type Bindings = {
  R2_ACCESS_KEY_ID: string;
  R2_ACCESS_KEY_SECRET: string;
  CLOUDFLARE_ACCOUNT_ID: string;
  ENVIRONMENT: string;
};

type Variables = {
  userId: string;
  orgId: string;
};

const presignSchema = z.object({
  filename: z.string().min(1).max(255),
});

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.use("*", async (c, next) => {
  const session = await auth().api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session) {
    return c.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orgId = session.session.activeOrganizationId;
  if (!orgId) {
    return c.json({ error: "No active organization" }, { status: 403 });
  }

  c.set("userId", session.user.id);
  c.set("orgId", orgId);
  await next();
});

app.post("/presign", async (c) => {
  const userId = c.get("userId");
  const orgId = c.get("orgId");

  const body = presignSchema.safeParse(await c.req.json());
  if (!body.success) {
    return c.json({ error: "Invalid request" }, { status: 400 });
  }

  const { filename } = body.data;
  const ext = filename.split(".").pop() ?? "";
  const uuid = crypto.randomUUID();
  const key = `receipts/${orgId}/${userId}/${uuid}${ext ? `.${ext}` : ""}`;

  const client = new S3Client({
    region: "auto",
    endpoint: `https://${c.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: c.env.R2_ACCESS_KEY_ID,
      secretAccessKey: c.env.R2_ACCESS_KEY_SECRET,
    },
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });

  const bucket =
    c.env.ENVIRONMENT === "production"
      ? "bhvr-uploads-prod"
      : "bhvr-uploads-dev";

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: "application/pdf",
    Metadata: { originalFilename: filename, userId, orgId },
  });

  const url = await getSignedUrl(client, command, { expiresIn: 3600 });

  return c.json({ url, key });
});

export default app;
