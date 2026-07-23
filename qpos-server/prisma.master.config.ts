import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/master/schema.prisma",
  migrations: {
    path: "prisma/master/migrations"
  },
  datasource: {
    url: process.env["MASTER_DATABASE_URL"]
  }
});
