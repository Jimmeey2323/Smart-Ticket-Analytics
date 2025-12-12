import dotenv from "dotenv";
dotenv.config();

import postgres from "postgres";

function getConnectionString(): string {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error("DATABASE_URL is required");

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
    // Ensure core tables exist (minimal) then add any missing columns expected by the app.
    // We intentionally keep types permissive to avoid enum/type conflicts with existing installs.

    await sql.unsafe(
      `create table if not exists public.categories (
        id text primary key,
        name text
      );`,
    );
    await sql.unsafe(
      `alter table public.categories
        add column if not exists description text,
        add column if not exists icon text,
        add column if not exists color text,
        add column if not exists default_department text,
        add column if not exists is_active boolean not null default true,
        add column if not exists created_at timestamptz default now();`,
    );

    await sql.unsafe(
      `create table if not exists public.subcategories (
        id text primary key,
        category_id text,
        name text
      );`,
    );
    await sql.unsafe(
      `alter table public.subcategories
        add column if not exists description text,
        add column if not exists form_fields jsonb,
        add column if not exists default_department text,
        add column if not exists is_active boolean not null default true,
        add column if not exists created_at timestamptz default now();`,
    );

    await sql.unsafe(
      `create table if not exists public.locations (
        id text primary key,
        name text
      );`,
    );
    await sql.unsafe(
      `alter table public.locations
        add column if not exists address text,
        add column if not exists is_active boolean not null default true,
        add column if not exists created_at timestamptz default now();`,
    );

    // Tickets is the heaviest table and is frequently selected with "select *".
    await sql.unsafe(
      `create table if not exists public.tickets (
        id text primary key
      );`,
    );
    await sql.unsafe(
      `alter table public.tickets
        add column if not exists ticket_number text,
        add column if not exists category_id text,
        add column if not exists subcategory_id text,
        add column if not exists client_name text,
        add column if not exists client_email text,
        add column if not exists client_phone text,
        add column if not exists client_status text,
        add column if not exists client_mood text,
        add column if not exists title text,
        add column if not exists description text,
        add column if not exists action_taken_immediately text,
        add column if not exists location_id text,
        add column if not exists incident_datetime timestamptz,
        add column if not exists reported_datetime timestamptz,
        add column if not exists status text,
        add column if not exists priority text,
        add column if not exists department text,
        add column if not exists assignee_id text,
        add column if not exists reported_by_id text,
        add column if not exists sla_deadline timestamptz,
        add column if not exists first_response_at timestamptz,
        add column if not exists resolved_at timestamptz,
        add column if not exists closed_at timestamptz,
        add column if not exists ai_tags text[],
        add column if not exists ai_sentiment text,
        add column if not exists ai_sentiment_score integer,
        add column if not exists ai_suggested_category text,
        add column if not exists ai_keywords text[],
        add column if not exists form_data jsonb,
        add column if not exists is_escalated boolean not null default false,
        add column if not exists escalated_at timestamptz,
        add column if not exists escalated_to_id text,
        add column if not exists escalation_reason text,
        add column if not exists follow_up_required boolean not null default false,
        add column if not exists follow_up_date timestamptz,
        add column if not exists attachments_count integer not null default 0,
        add column if not exists created_at timestamptz default now(),
        add column if not exists updated_at timestamptz default now();`,
    );

    await sql.unsafe(
      `create table if not exists public.ticket_comments (
        id text primary key,
        ticket_id text,
        user_id text,
        content text
      );`,
    );
    await sql.unsafe(
      `alter table public.ticket_comments
        add column if not exists is_internal boolean not null default false,
        add column if not exists created_at timestamptz default now(),
        add column if not exists updated_at timestamptz default now();`,
    );

    await sql.unsafe(
      `create table if not exists public.ticket_history (
        id text primary key,
        ticket_id text,
        user_id text,
        action text
      );`,
    );
    await sql.unsafe(
      `alter table public.ticket_history
        add column if not exists previous_value text,
        add column if not exists new_value text,
        add column if not exists description text,
        add column if not exists created_at timestamptz default now();`,
    );

    await sql.unsafe(
      `create table if not exists public.ticket_attachments (
        id text primary key,
        ticket_id text
      );`,
    );
    await sql.unsafe(
      `alter table public.ticket_attachments
        add column if not exists file_name text,
        add column if not exists file_type text,
        add column if not exists file_size integer,
        add column if not exists file_url text,
        add column if not exists uploaded_by_id text,
        add column if not exists created_at timestamptz default now();`,
    );

    await sql.unsafe(
      `create table if not exists public.notifications (
        id text primary key,
        user_id text,
        title text,
        message text
      );`,
    );
    await sql.unsafe(
      `alter table public.notifications
        add column if not exists ticket_id text,
        add column if not exists type text,
        add column if not exists is_read boolean not null default false,
        add column if not exists created_at timestamptz default now();`,
    );

    console.log("✅ Ensured core app schema columns exist");
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((err) => {
  console.error("❌ Failed ensuring app schema:", err);
  process.exit(1);
});
