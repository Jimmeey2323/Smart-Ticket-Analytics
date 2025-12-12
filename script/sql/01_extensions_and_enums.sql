-- 01_extensions_and_enums.sql
-- Enable required extensions and create enums used by the app

-- Enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- User role enum (not required for import but included for parity)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('admin','manager','team_member','support_staff');
  END IF;
END$$;

-- Ticket status enum (included for completeness)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ticket_status') THEN
    CREATE TYPE ticket_status AS ENUM ('open','in_progress','pending','resolved','closed','escalated');
  END IF;
END$$;

-- Ticket priority enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ticket_priority') THEN
    CREATE TYPE ticket_priority AS ENUM ('low','medium','high','critical');
  END IF;
END$$;

-- Department enum used by categories/subcategories
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'department') THEN
    CREATE TYPE department AS ENUM ('operations','facilities','training','sales','client_success','marketing','finance','management');
  END IF;
END$$;
