import dotenv from "dotenv";
dotenv.config();

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import dns from "dns";
import * as schema from "@shared/schema";
import { createClient } from '@supabase/supabase-js';

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
  console.warn(
    '⚠️ SUPABASE_SERVICE_ROLE_KEY is not set; server Supabase client will use a non-admin key (RLS may block some operations).',
  );
}

// Create Supabase client for server operations (service role if present, otherwise falls back)
export const supabase = createClient(supabaseUrl, supabaseKey);

// Database connection using postgres-js (better for serverless)
const rawDatabaseUrl = process.env.DATABASE_URL;
if (!rawDatabaseUrl) {
  throw new Error('Missing DATABASE_URL environment variable');
}

let connectionString: string = rawDatabaseUrl;

// Extract database URL from Supabase for postgres-js
if (connectionString.includes('supabase.co')) {
  // Convert from postgresql:// to format postgres-js expects
  const url = new URL(connectionString);
  connectionString = `postgres://${url.username}:${url.password}@${url.hostname}:${url.port}${url.pathname}`;
}

console.log('🔗 Connecting to Supabase PostgreSQL database...');

let db: any;
let sql: any;

async function tryConnect(urlString: string) {
  // create postgres-js instance with optimized settings for Supabase
  const instance = postgres(urlString, {
    max: 20,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
    ssl: urlString.includes('supabase.co') ? { rejectUnauthorized: false } : false,
  });

  const drizzleDb = drizzle(instance, { schema });
  return { instance, drizzleDb };
}

async function connectWithFallback() {
  try {
    const result = await tryConnect(connectionString);
    sql = result.instance;
    db = result.drizzleDb;
    console.log('✅ Database connected successfully');
    return;
  } catch (error: any) {
    console.error('❌ Initial DB connection failed:', error && error.message ? error.message : error);

    // If the failure looks like an unreachable host (commonly EHOSTUNREACH),
    // attempt to resolve an IPv4 address and reconnect using that.
    const isNetworkError = error && (error.code === 'EHOSTUNREACH' || /EHOSTUNREACH|ENETUNREACH|ECONNREFUSED/.test(String(error)));

    if (!isNetworkError) {
      // Non-network error: don't attempt fallback.
      throw error;
    }

    try {
      const parsed = new URL(connectionString);
      const hostname = parsed.hostname;
      console.log(`🔎 Attempting IPv4 lookup for host ${hostname} as fallback...`);
      const addresses = await dns.promises.resolve4(hostname).catch(() => []);
      if (!addresses || addresses.length === 0) {
        console.warn('⚠️  No IPv4 addresses found for host, cannot fallback to IPv4');
        throw error;
      }

      const ipv4 = addresses[0];
      console.log(`➡️  Resolved IPv4 ${ipv4}, retrying DB connection using IPv4`);

      // Replace host in connection string with IPv4 (preserve auth and port/path)
      parsed.hostname = ipv4;
      // when hostname is numeric-ip, ensure username/password remain intact
      const ipv4ConnectionString = parsed.toString();

      const result2 = await tryConnect(ipv4ConnectionString);
      sql = result2.instance;
      db = result2.drizzleDb;
      console.log('✅ Database connected successfully via IPv4 fallback');
      return;
    } catch (innerErr) {
      console.error('❌ IPv4 fallback failed:', innerErr && (innerErr as Error).message ? (innerErr as Error).message : innerErr);
      throw innerErr;
    }
  }
}

// Start connection attempt (await this before serving requests)
export const dbReady = connectWithFallback();

// Export database instance and utilities
export { db, sql };

// Helper function to test database connection
export async function testConnection() {
  try {
    await sql`SELECT 1 as test`;
    console.log('✅ Database connection test successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    return false;
  }
}

// Helper function to close database connection
export async function closeConnection() {
  try {
    if (sql) {
      await sql.end();
      console.log('📴 Database connection closed');
    }
  } catch (error) {
    console.error('❌ Error closing database connection:', error);
  }
}
