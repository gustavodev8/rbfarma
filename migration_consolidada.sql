-- ================================================================
-- MIGRATION CONSOLIDADA — RB FARMA
-- Execute inteiro no Supabase SQL Editor
-- Seguro para re-executar (usa IF NOT EXISTS e DO blocks)
-- ================================================================


-- ----------------------------------------------------------------
-- 1. FLUXO DE CAIXA
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fluxo_caixa (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo            TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  categoria       TEXT NOT NULL,
  descricao       TEXT NOT NULL,
  valor           NUMERIC(10, 2) NOT NULL,
  data            DATE NOT NULL,
  forma_pagamento TEXT,
  observacao      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE fluxo_caixa ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Admin full access fluxo_caixa"
    ON fluxo_caixa FOR ALL
    USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ----------------------------------------------------------------
-- 2. COLABORADORES
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS colaboradores (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  nome          TEXT        NOT NULL,
  telefone      TEXT,
  email         TEXT,
  cpf           TEXT,
  salario       NUMERIC(10, 2),
  data_admissao DATE,
  observacao    TEXT,
  ativo         BOOLEAN     NOT NULL DEFAULT true,
  comissao_pct  NUMERIC(5, 2) NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE colaboradores ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Admin full access colaboradores"
    ON colaboradores FOR ALL
    USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ----------------------------------------------------------------
-- 3. ORDERS — colunas adicionais
-- ----------------------------------------------------------------
ALTER TABLE orders ADD COLUMN IF NOT EXISTS vendedor_nome TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cupom_codigo  TEXT DEFAULT NULL;


-- ----------------------------------------------------------------
-- 4. PRODUCTS — colunas adicionais
-- ----------------------------------------------------------------
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_min INTEGER NOT NULL DEFAULT 5;


-- ----------------------------------------------------------------
-- 5. PROFILES — endereço
-- ----------------------------------------------------------------
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS address_cep          TEXT,
  ADD COLUMN IF NOT EXISTS address_street       TEXT,
  ADD COLUMN IF NOT EXISTS address_number       TEXT,
  ADD COLUMN IF NOT EXISTS address_complement   TEXT,
  ADD COLUMN IF NOT EXISTS address_neighborhood TEXT,
  ADD COLUMN IF NOT EXISTS address_city         TEXT,
  ADD COLUMN IF NOT EXISTS address_state        TEXT;


-- ----------------------------------------------------------------
-- 6. METAS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS metas (
  id               UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  mes              TEXT          NOT NULL UNIQUE,
  meta_faturamento NUMERIC(12, 2) NOT NULL DEFAULT 0,
  meta_pedidos     INTEGER        NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ   DEFAULT NOW(),
  updated_at       TIMESTAMPTZ   DEFAULT NOW()
);

ALTER TABLE metas ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Admin full access to metas"
    ON metas FOR ALL
    USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ----------------------------------------------------------------
-- 7. CUPONS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cupons (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo       TEXT        NOT NULL UNIQUE,
  tipo         TEXT        NOT NULL CHECK (tipo IN ('percentual', 'fixo')),
  valor        NUMERIC(10, 2) NOT NULL,
  valor_minimo NUMERIC(10, 2) DEFAULT NULL,
  validade     DATE        DEFAULT NULL,
  usos_limite  INTEGER     DEFAULT NULL,
  usos_count   INTEGER     NOT NULL DEFAULT 0,
  ativo        BOOLEAN     NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE cupons ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Public read cupons"
    ON cupons FOR SELECT
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated write cupons"
    ON cupons FOR ALL TO authenticated
    USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ----------------------------------------------------------------
-- 8. CONTAS A PAGAR / RECEBER
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contas (
  id         UUID           DEFAULT gen_random_uuid() PRIMARY KEY,
  descricao  TEXT           NOT NULL,
  valor      NUMERIC(10, 2) NOT NULL,
  tipo       TEXT           NOT NULL CHECK (tipo IN ('pagar', 'receber')),
  vencimento DATE           NOT NULL,
  status     TEXT           NOT NULL DEFAULT 'pendente'
               CHECK (status IN ('pendente', 'pago', 'vencido')),
  categoria  TEXT           NOT NULL,
  observacao TEXT           DEFAULT NULL,
  created_at TIMESTAMPTZ    DEFAULT NOW(),
  updated_at TIMESTAMPTZ    DEFAULT NOW()
);

ALTER TABLE contas ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Admin full access to contas"
    ON contas FOR ALL
    USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ----------------------------------------------------------------
-- 9. COLABORADORES — coluna comissao_pct (caso tabela já existia)
-- ----------------------------------------------------------------
ALTER TABLE colaboradores ADD COLUMN IF NOT EXISTS comissao_pct NUMERIC(5, 2) NOT NULL DEFAULT 0;
