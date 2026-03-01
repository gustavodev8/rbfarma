-- ============================================================
-- RB FARMA — Perfumes de Farmácia (10 produtos)
-- Cole e execute no SQL Editor do Supabase
-- ============================================================

-- PASSO 1: Criar seção (se ainda não existir)
INSERT INTO sections (name, display_order, is_active)
VALUES ('Perfumes em Destaque', 14, true)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- PASSO 2: Inserir os 10 perfumes
-- ============================================================
INSERT INTO products (name, brand, quantity, price, original_price, discount, image_url, category, sections, is_active)
VALUES

-- ── GIOVANNA BABY ─────────────────────────────────────────
('Colônia Giovanna Baby Blueberry', 'Giovanna Baby', '50ml', 53.24, 87.13, 39,
 'https://cdn.ultrafarma.com.br/static/produtos/815097/small-637202433898013118-815097.jpg',
 'perfumes', ARRAY['Perfumes em Destaque'], true),

('Colônia Giovanna Baby Gaby', 'Giovanna Baby', '120ml', 36.84, 45.90, 20,
 'https://cdn.ultrafarma.com.br/static/produtos/815408/small-638866508395101976-815408_3.png',
 'perfumes', ARRAY['Perfumes em Destaque'], true),

('Colônia Giovanna Baby Silver', 'Giovanna Baby', '50ml', 61.94, 74.90, 17,
 'https://cdn.ultrafarma.com.br/static/produtos/826554/small-638563008310375971-826554.png',
 'perfumes', ARRAY['Perfumes em Destaque'], true),

('Colônia Giovanna Baby Rose Gold', 'Giovanna Baby', '50ml', 66.23, 79.90, 17,
 'https://cdn.ultrafarma.com.br/static/produtos/826556/small-638563006708190079-826556.png',
 'perfumes', ARRAY['Perfumes em Destaque'], true),

('Colônia Giovanna Baby Gold', 'Giovanna Baby', '50ml', 65.80, 79.90, 18,
 'https://cdn.ultrafarma.com.br/static/produtos/826557/small-638563005237039517-826557.png',
 'perfumes', ARRAY['Perfumes em Destaque'], true),

-- ── JEQUITI ───────────────────────────────────────────────
('Colônia Jequiti Hot Wheels Masculino', 'Jequiti', '25ml', 28.79, 38.84, 26,
 'https://cdn.ultrafarma.com.br/static/produtos/830614/small-638870579582835029-830614.png',
 'perfumes', ARRAY['Perfumes em Destaque'], true),

('Colônia Jequiti Portiolli Gold Masculino', 'Jequiti', '25ml', 37.43, 56.89, 34,
 'https://cdn.ultrafarma.com.br/static/produtos/821781/small-638005786464075415-821781.jpg',
 'perfumes', ARRAY['Perfumes em Destaque'], true),

-- ── CARMED / BODY SPLASH ──────────────────────────────────
('Body Splash Luz do Sol Glow', 'Carmed by Cimed', '200ml', 63.20, 94.04, 33,
 'https://cdn.ultrafarma.com.br/static/produtos/830210/small-638832565982073568-830210.png',
 'perfumes', ARRAY['Perfumes em Destaque'], true),

('Body Splash Nas Nuvens', 'Carmed by Cimed', '200ml', 63.20, 94.04, 33,
 'https://cdn.ultrafarma.com.br/static/produtos/830211/small-638832569127662653-830211.png',
 'perfumes', ARRAY['Perfumes em Destaque'], true),

-- ── TABU ──────────────────────────────────────────────────
('Colônia Tabu Tradicional Feminino', 'Tabu', '60ml', 11.25, 13.02, 14,
 'https://cdn.ultrafarma.com.br/static/produtos/30379/small-30379.jpg',
 'perfumes', ARRAY['Perfumes em Destaque'], true);
