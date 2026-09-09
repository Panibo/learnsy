import { connectDatabase, disconnectDatabase } from "./db.js";
import { initializeUsers } from "./models/user.js";
import { createApiServer } from "./server.js";

let server: ReturnType<typeof createApiServer> | undefined;

async function main() {
  const db = await connectDatabase();
  await initializeUsers(db);
  const origins = (process.env.WEB_ORIGINS ?? "http://localhost:3000,http://127.0.0.1:3000").split(",").map((value) => value.trim()).filter(Boolean);
  const port = Number(process.env.PORT ?? 4000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Invalid PORT");
  server = createApiServer(db, origins);
  server.on("error", () => {
    console.error("Profile API could not start. Check the configured host and port.");
    disconnectDatabase().finally(() => { process.exitCode = 1; });
  });
  server.listen(port, process.env.HOST ?? "127.0.0.1", () => console.log(`Profile API listening on port ${port}`));
}

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => {
    if (server?.listening) server.close(() => { void disconnectDatabase(); });
    else void disconnectDatabase();
  });
}

main().catch(async () => {
  console.error("Backend startup failed. Check the database and server configuration.");
  await disconnectDatabase();
  process.exitCode = 1;
});
