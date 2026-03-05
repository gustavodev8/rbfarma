-- Cria tabela de metas mensais
-- Execute no Supabase SQL Editor

CREATE TABLE IF NOT EXISTS metas (
  id               UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  mes              TEXT        NOT NULL UNIQUE,  -- formato YYYY-MM
  meta_faturamento NUMERIC(12, 2) NOT NULL DEFAULT 0,
  meta_pedidos     INTEGER        NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE metas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access to metas"
  ON metas FOR ALL
  USING (true)
  WITH CHECK (true);
