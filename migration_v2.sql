-- ============================================================
-- MIGRATION V2 — Fornecedores, Fechamento de Caixa, Validade/Lote
-- Execute no Supabase > SQL Editor
-- ============================================================

-- ─── 1. Fornecedores ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fornecedores (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        TEXT NOT NULL,
  cnpj        TEXT,
  telefone    TEXT,
  email       TEXT,
  contato     TEXT,          -- nome do representante
  observacoes TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE fornecedores ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'fornecedores' AND policyname = 'allow_all_fornecedores'
  ) THEN
    CREATE POLICY allow_all_fornecedores ON fornecedores FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ─── 2. Colunas de validade/lote/fornecedor nos produtos ─────────────────────
ALTER TABLE products ADD COLUMN IF NOT EXISTS lote       TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS validade   DATE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS fornecedor_id UUID REFERENCES fornecedores(id) ON DELETE SET NULL;

-- ─── 3. Fechamento de Caixa ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS caixa_fechamentos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data            DATE NOT NULL UNIQUE,       -- um fechamento por dia
  saldo_inicial   NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_dinheiro  NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_pix       NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_cartao    NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_saidas    NUMERIC(10,2) NOT NULL DEFAULT 0,
  saldo_final     NUMERIC(10,2) NOT NULL DEFAULT 0,
  observacoes     TEXT,
  status          TEXT NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto','fechado')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE caixa_fechamentos ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'caixa_fechamentos' AND policyname = 'allow_all_caixa'
  ) THEN
    CREATE POLICY allow_all_caixa ON caixa_fechamentos FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
