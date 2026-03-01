-- ─────────────────────────────────────────────────────────────────────────────
-- Tabela de Banners — RB FARMA
-- Execute este script no Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Criar tabela
CREATE TABLE IF NOT EXISTS banners (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url           TEXT NOT NULL,
  file_name     TEXT NOT NULL DEFAULT '',
  display_order INT  NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- 2. RLS (Row Level Security)
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

-- Visitantes leem apenas banners ativos
CREATE POLICY "public read active banners"
  ON banners FOR SELECT
  USING (is_active = true);

-- Admin lê todos
CREATE POLICY "authenticated read all banners"
  ON banners FOR SELECT
  TO authenticated
  USING (true);

-- Admin pode inserir, atualizar e deletar
CREATE POLICY "authenticated manage banners"
  ON banners FOR ALL
  TO authenticated
  USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Storage bucket para as imagens dos banners
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('banners', 'banners', true)
ON CONFLICT DO NOTHING;

-- Leitura pública das imagens
CREATE POLICY "public read banner images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'banners');

-- Upload autenticado
CREATE POLICY "authenticated upload banner images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'banners');

-- Delete autenticado
CREATE POLICY "authenticated delete banner images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'banners');
