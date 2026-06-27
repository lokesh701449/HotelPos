import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import Database from "better-sqlite3";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

// Determine database path
const dbPath = path.resolve(
  __dirname,
  process.env.NODE_ENV === "production" 
    ? "../prisma/dev.db" 
    : "../../prisma/dev.db"
);

const adapter = new PrismaBetterSqlite3({
  url: `file:${dbPath}`
});

export const prisma = new PrismaClient({ adapter });
