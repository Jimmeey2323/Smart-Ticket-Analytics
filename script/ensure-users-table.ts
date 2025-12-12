import dotenv from "dotenv";
dotenv.config();

import postgres from "postgres";

function getConnectionString(): string {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error("DATABASE_URL is required");

  // postgres-js supports both postgres:// and postgresql://, but we normalize
  // to postgres:// and preserve credentials/host/port/path.
  if (raw.includes("supabase.co")) {
    const url = new URL(raw);
    return `postgres://${url.username}:${url.password}@${url.hostname}:${url.port}${url.pathname}`;
  }

  return raw;
}

async function main() {
  const connectionString = getConnectionString();

  const sql = postgres(connectionString, {
    max: 1,
    idle_timeout: 10,
    connect_timeout: 10,
    prepare: false,
    ssl: connectionString.includes("supabase.co") ? { rejectUnauthorized: false } : false,
  });

  try {
    // Ensure the app's public.users table contains the columns our Drizzle schema selects.
    // Keep types permissive to avoid enum/type conflicts with existing installations.
    await sql`
      create table if not exists public.users (
        id text primary key,
        email text unique
      );
    `;

    await sql`
      alter table public.users
        add column if not exists first_name text,
        add column if not exists last_name text,
        add column if not exists profile_image_url text,
        add column if not exists role text,
        add column if not exists department text,
        add column if not exists is_active boolean not null default true,
        add column if not exists created_at timestamptz default now(),
        add column if not exists updated_at timestamptz default now();
    `;

    // Some deployments created the table without unique email.
    await sql`do $$ begin
      if not exists (
        select 1
        from pg_constraint
        where conname = 'users_email_key'
      ) then
        begin
          alter table public.users add constraint users_email_key unique (email);
        exception when duplicate_object then
          null;
        end;
      end if;
    end $$;`;

    console.log("✅ Ensured public.users columns exist");
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((err) => {
  console.error("❌ Failed ensuring users table:", err);
  process.exit(1);
});
