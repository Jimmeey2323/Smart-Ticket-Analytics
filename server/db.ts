import dotenv from "dotenv";
dotenv.config();

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import dns from "dns";
import * as schema from "@shared/schema";
import { createClient } from '@supabase/supabase-js';

// Some networks (especially on dev machines) have broken/blocked IPv6 routes.
// Supabase DB hosts publish AAAA records, so Node may pick IPv6 first and fail
// with EHOSTUNREACH. Prefer IPv4 to avoid intermittent DB connection failures.
try {
  (dns as any).setDefaultResultOrder?.('ipv4first');
} catch {
  // best-effort only
}

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing Supabase configuration. Please set SUPABASE_URL (or VITE_SUPABASE_URL) and one of SUPABASE_SERVICE_ROLE_KEY / SUPABASE_PUBLISHABLE_KEY / VITE_SUPABASE_ANON_KEY.',
  );
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('SUPABASE_SERVICE_ROLE_KEY is not set; server operations may be restricted by RLS.');
}

// Create Supabase client for server operations (service role if present, otherwise falls back)
export const supabase = createClient(supabaseUrl, supabaseKey);

// Database connection using postgres-js (better for serverless)
const rawDatabaseUrl = process.env.DATABASE_URL;
if (!rawDatabaseUrl) {
  throw new Error('Missing DATABASE_URL environment variable');
}

let connectionString: string = rawDatabaseUrl;

// postgres-js supports both postgres:// and postgresql://.
// IMPORTANT: Keep the raw URL intact so percent-encoded passwords (e.g. %40)
// remain valid. Reconstructing URLs can accidentally un-escape reserved chars.

let db: any;
let sql: any;

async function tryConnect(urlString: string) {
  // create postgres-js instance with optimized settings for Supabase
  const instance = postgres(urlString, {
    max: 20,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
    ssl: /supabase\.(co|com)/i.test(urlString) ? { rejectUnauthorized: false } : false,
    fetch_types: false,
  });

  const drizzleDb = drizzle(instance, { schema });
  return { instance, drizzleDb };
}

async function connectWithFallback() {
  try {
    const result = await tryConnect(connectionString);
    sql = result.instance;
    db = result.drizzleDb;
  } catch (error: any) {
    console.error('Database connection failed:', error && error.message ? error.message : error);
    throw error;
  }
}

// Start connection attempt (await this before serving requests)
export const dbReady = connectWithFallback();

// Export database instance and utilities
export { db, sql };
