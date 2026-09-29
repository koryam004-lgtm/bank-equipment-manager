/*
# Bank Equipment Management Schema

## Overview
Creates a complete schema for managing bank equipment (ATMs, POS terminals, servers, etc.)
including categories, branches, maintenance records, and equipment assignments.

## New Tables

### 1. categories
- `id` (uuid, PK)
- `name` (text, not null) — e.g. "ATM", "POS Terminal", "Server"
- `description` (text)
- `icon` (text) — lucide icon name for display
- `created_at` (timestamptz)

### 2. branches
- `id` (uuid, PK)
- `name` (text, not null) — branch name
- `code` (text, unique, not null) — branch code
- `address` (text)
- `city` (text)
- `phone` (text)
- `created_at` (timestamptz)

### 3. equipment
- `id` (uuid, PK)
- `name` (text, not null) — equipment name/label
- `serial_number` (text, unique, not null)
- `category_id` (uuid, FK → categories)
- `branch_id` (uuid, FK → branches)
- `status` (text, not null, default 'operational') — operational | maintenance | faulty | retired
- `purchase_date` (date)
- `purchase_cost` (numeric(12,2))
- `warranty_expiry` (date)
- `notes` (text)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### 4. maintenance_records
- `id` (uuid, PK)
- `equipment_id` (uuid, FK → equipment, ON DELETE CASCADE)
- `type` (text, not null) — preventive | corrective | inspection
- `description` (text, not null)
- `cost` (numeric(12,2), default 0)
- `technician` (text)
- `status` (text, not null, default 'scheduled') — scheduled | in_progress | completed | cancelled
- `scheduled_date` (date)
- `completed_date` (date)
- `created_at` (timestamptz)

## Security
- RLS enabled on all tables.
- Single-tenant (no auth) — policies allow anon + authenticated full CRUD.
- `USING (true)` is acceptable because the data is intentionally shared/public.
*/

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon text DEFAULT 'Package',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_categories" ON categories;
CREATE POLICY "anon_select_categories" ON categories FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_categories" ON categories;
CREATE POLICY "anon_insert_categories" ON categories FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_categories" ON categories;
CREATE POLICY "anon_update_categories" ON categories FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_categories" ON categories;
CREATE POLICY "anon_delete_categories" ON categories FOR DELETE
  TO anon, authenticated USING (true);

-- Branches
CREATE TABLE IF NOT EXISTS branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  address text,
  city text,
  phone text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE branches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_branches" ON branches;
CREATE POLICY "anon_select_branches" ON branches FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_branches" ON branches;
CREATE POLICY "anon_insert_branches" ON branches FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_branches" ON branches;
CREATE POLICY "anon_update_branches" ON branches FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_branches" ON branches;
CREATE POLICY "anon_delete_branches" ON branches FOR DELETE
  TO anon, authenticated USING (true);

-- Equipment
CREATE TABLE IF NOT EXISTS equipment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  serial_number text UNIQUE NOT NULL,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  branch_id uuid REFERENCES branches(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'operational',
  purchase_date date,
  purchase_cost numeric(12,2),
  warranty_expiry date,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_equipment" ON equipment;
CREATE POLICY "anon_select_equipment" ON equipment FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_equipment" ON equipment;
CREATE POLICY "anon_insert_equipment" ON equipment FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_equipment" ON equipment;
CREATE POLICY "anon_update_equipment" ON equipment FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_equipment" ON equipment;
CREATE POLICY "anon_delete_equipment" ON equipment FOR DELETE
  TO anon, authenticated USING (true);

-- Maintenance records
CREATE TABLE IF NOT EXISTS maintenance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id uuid NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  type text NOT NULL,
  description text NOT NULL,
  cost numeric(12,2) DEFAULT 0,
  technician text,
  status text NOT NULL DEFAULT 'scheduled',
  scheduled_date date,
  completed_date date,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE maintenance_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_maintenance" ON maintenance_records;
CREATE POLICY "anon_select_maintenance" ON maintenance_records FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_maintenance" ON maintenance_records;
CREATE POLICY "anon_insert_maintenance" ON maintenance_records FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_maintenance" ON maintenance_records;
CREATE POLICY "anon_update_maintenance" ON maintenance_records FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_maintenance" ON maintenance_records;
CREATE POLICY "anon_delete_maintenance" ON maintenance_records FOR DELETE
  TO anon, authenticated USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_equipment_category_id ON equipment(category_id);
CREATE INDEX IF NOT EXISTS idx_equipment_branch_id ON equipment(branch_id);
CREATE INDEX IF NOT EXISTS idx_equipment_status ON equipment(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_equipment_id ON maintenance_records(equipment_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON maintenance_records(status);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_equipment_updated_at ON equipment;
CREATE TRIGGER update_equipment_updated_at BEFORE UPDATE ON equipment
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
