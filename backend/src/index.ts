import app from "@/app";
import { env } from "@/lib/env";

Bun.serve({
  fetch: app.fetch,
  port: env.port,
});

console.log(`API server listening on http://localhost:${env.port}`);
