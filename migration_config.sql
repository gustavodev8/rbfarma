-- ============================================================
-- RB FARMA — Migration: config + observacoes
-- Execute no painel Supabase > SQL Editor
-- ============================================================

-- 1. Tabela de configurações do sistema
CREATE TABLE IF NOT EXISTS config (
  id          TEXT PRIMARY KEY,
  valor       TEXT NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Valores padrão (taxa cartão 2,5% a partir de 2x, máx 6 parcelas)
INSERT INTO config (id, valor) VALUES
  ('taxa_cartao_pct',               '2.50'),
  ('taxa_cartao_parcelas_max',       '6'),
  ('taxa_cartao_juros_a_partir_de',  '2')
ON CONFLICT (id) DO NOTHING;

-- 3. Coluna observações nos pedidos
ALTER TABLE orders ADD COLUMN IF NOT EXISTS observacoes TEXT;

-- 4. RLS para config (leitura pública, escrita autenticada)
ALTER TABLE config ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "config_read_all" ON config FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "config_write_auth" ON config FOR ALL USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
