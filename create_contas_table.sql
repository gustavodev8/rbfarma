-- Cria tabela de contas a pagar/receber
-- Execute no Supabase SQL Editor

CREATE TABLE IF NOT EXISTS contas (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  descricao  TEXT        NOT NULL,
  valor      NUMERIC(10, 2) NOT NULL,
  tipo       TEXT        NOT NULL CHECK (tipo IN ('pagar', 'receber')),
  vencimento DATE        NOT NULL,
  status     TEXT        NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'vencido')),
  categoria  TEXT        NOT NULL,
  observacao TEXT        DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE contas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access to contas"
  ON contas FOR ALL
  USING (true)
  WITH CHECK (true);

-- Adiciona comissao_pct na tabela de colaboradores
ALTER TABLE colaboradores ADD COLUMN IF NOT EXISTS comissao_pct NUMERIC(5,2) NOT NULL DEFAULT 0;
