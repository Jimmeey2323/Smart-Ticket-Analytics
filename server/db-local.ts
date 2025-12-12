import dotenv from "dotenv";
dotenv.config();

import { drizzle } from "drizzle-orm/node-postgres";
import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

// Check if we should use local SQLite fallback
const useLocalFallback = !process.env.DATABASE_URL || process.env.USE_LOCAL_DB === "true";

export let db: any;
export let pool: any;

if (useLocalFallback) {
  console.log("🔄 Using local SQLite database for development");
  
  // Create SQLite database for local development
  const sqlite = new Database("local_dev.db");
  db = drizzleSqlite(sqlite, { schema });
  
  // Mock pool for compatibility
  pool = {
    query: () => Promise.resolve({ rows: [] }),
    end: () => Promise.resolve(),
  };
} else {
  console.log("🔄 Connecting to remote PostgreSQL database");
  
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL must be set. Did you forget to provision a database?",
    );
  }

  // Use PostgreSQL for production/Replit
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 3,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 5000,
  });

  db = drizzle(pool, { schema });
}