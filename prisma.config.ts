import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  datasource: {
    url:
      process.env.DATABASE_URL ??
      process.env.DIRECT_URL ??
      "postgresql://postgres:postgres@localhost:5432/kasirfy?schema=public",
  },
});
