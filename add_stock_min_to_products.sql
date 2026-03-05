-- Adiciona coluna de estoque mínimo aos produtos
-- Execute no Supabase SQL Editor

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS stock_min INTEGER NOT NULL DEFAULT 5;
