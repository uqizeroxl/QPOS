import app from "./app";
import { appConfig } from "./config/app.config";
import { disconnectAllStorePrismaClients } from "./utils/store-prisma";

const server = app.listen(appConfig.port, () => {
  process.stdout.write(`QPOS API is running on port ${appConfig.port}\n`);
});

const shutdown = async () => {
  server.close(async () => {
    await disconnectAllStorePrismaClients();
    process.exit(0);
  });
};

process.on("SIGINT", () => {
  void shutdown();
});

process.on("SIGTERM", () => {
  void shutdown();
});
