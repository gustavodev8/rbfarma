-- ============================================================
-- RB FARMA — Adicionar coluna de estoque na tabela products
-- Execute no SQL Editor do Supabase
-- ============================================================

-- Adiciona a coluna stock (NULL = sem controle, 0 = esgotado, >0 = quantidade)
ALTER TABLE products
ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT NULL;

-- Comentário explicativo na coluna
COMMENT ON COLUMN products.stock IS
  'Controle de estoque: NULL = sem controle (sempre disponível), 0 = esgotado, >0 = quantidade disponível';
