-- Cria tabela de cupons de desconto
-- Execute no Supabase SQL Editor

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

-- Leitura publica (para validar no checkout mesmo sem login)
CREATE POLICY "Public read cupons" ON cupons FOR SELECT USING (true);
-- Escrita apenas para autenticados (admin)
CREATE POLICY "Authenticated write cupons" ON cupons
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Adiciona cupom_codigo na tabela de pedidos
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cupom_codigo TEXT DEFAULT NULL;
