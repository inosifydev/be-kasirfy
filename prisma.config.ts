import path from "node:path";
import dotenv from "dotenv";
import { defineConfig } from "prisma/config";

const envLocalPath = path.resolve(process.cwd(), ".env.local");
const envPath = path.resolve(process.cwd(), ".env");

dotenv.config({ path: envLocalPath });
dotenv.config({ path: envPath });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not defined. Set it in .env.local or environment variables.");
}

export default defineConfig({
  datasource: {
    url: databaseUrl,
  },
});
