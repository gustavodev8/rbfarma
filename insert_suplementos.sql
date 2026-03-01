-- ============================================================
-- RB FARMA — Suplementos de Academia (15 produtos)
-- Cole e execute no SQL Editor do Supabase
-- ============================================================

-- PASSO 1: Criar as seções (se ainda não existirem)
-- Se as seções já existem com outros nomes, ajuste conforme necessário.
INSERT INTO sections (name, display_order, is_active)
VALUES
  ('Suplementos Populares', 10, true),
  ('Queima de Gordura',     11, true),
  ('Ganho de Massa',        12, true),
  ('Vitaminas Esportivas',  13, true)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- PASSO 2: Inserir os 15 produtos de suplemento
-- ============================================================
INSERT INTO products (name, brand, quantity, price, original_price, discount, image_url, category, sections, is_active)
VALUES

-- ── SUPLEMENTOS POPULARES ─────────────────────────────────
('Whey Protein Concentrado 900g', 'WOD Nutrition', '900g - Sabor Chocolate', 62.38, 79.90, 22,
 'https://cdn.ultrafarma.com.br/static/produtos/827105/small-638590814025503619-827105_2.jpg',
 'suplementos', ARRAY['Suplementos Populares'], true),

('Whey Protein Isolado 900g', 'Atlhetica Nutrition', '900g - Sabor Baunilha', 89.90, 109.90, 18,
 'https://cdn.ultrafarma.com.br/static/produtos/827976/small-638621033205904154-827976_2.png',
 'suplementos', ARRAY['Suplementos Populares'], true),

('Creatina Monohidratada 300g', 'Sidney Oliveira', '300g - Pura 100%', 59.90, 79.90, 25,
 'https://cdn.ultrafarma.com.br/static/produtos/828819/small-638696227361408882-828819.png',
 'suplementos', ARRAY['Suplementos Populares'], true),

('BCAA 2:1:1 60 Cápsulas', 'Atlhetica Nutrition', '60 cápsulas', 27.80, 35.90, 23,
 'https://cdn.ultrafarma.com.br/static/produtos/827814/small-638615924729874438-827814_2.png',
 'suplementos', ARRAY['Suplementos Populares'], true),

('Glutamina 300g', 'Synthesize', '300g - Pura', 74.14, 94.90, 22,
 'https://cdn.ultrafarma.com.br/static/produtos/825424/small-638620912687865325-825424_3.png',
 'suplementos', ARRAY['Suplementos Populares'], true),

-- ── QUEIMA DE GORDURA ─────────────────────────────────────
('Kimera Thermo 60 Cápsulas', 'Iridium Labs', '60 cápsulas', 49.90, 64.90, 23,
 'https://cdn.ultrafarma.com.br/static/produtos/808366/small-638629777555052932-808366_2.png',
 'suplementos', ARRAY['Queima de Gordura'], true),

('Thermo Flame 60 Tabletes', 'Black Skull', '60 tabletes', 20.90, 29.90, 30,
 'https://cdn.ultrafarma.com.br/static/produtos/831504/small-638957146448053015-831504.png',
 'suplementos', ARRAY['Queima de Gordura'], true),

('L-Carnitina 2000mg 120 Cápsulas', 'Integralmedica', '120 cápsulas', 44.90, 59.90, 25,
 'https://cdn.ultrafarma.com.br/static/produtos/831061/small-638907839096933954-831061.png',
 'suplementos', ARRAY['Queima de Gordura'], true),

-- ── GANHO DE MASSA ────────────────────────────────────────
('Hipercalórico Masstodon Baunilha 3kg', 'Black Skull', '3kg - Sabor Baunilha', 97.53, 129.90, 25,
 'https://cdn.ultrafarma.com.br/static/produtos/831484/small-638956376523821274-831484_2.png',
 'suplementos', ARRAY['Ganho de Massa'], true),

('Albumina Protein 500g', 'Bodybuilders', '500g - Sem Sabor', 39.90, 52.90, 25,
 'https://static.netshoes.com.br/produtos/albumina-protein-500g-refil-bodybuilders/62/E56-0015-962/E56-0015-962_zoom1.jpg',
 'suplementos', ARRAY['Ganho de Massa'], true),

('Maltodextrina 1kg Laranja', 'Probiótica', '1kg - Sabor Laranja', 32.99, 42.99, 23,
 'https://cdn.ultrafarma.com.br/static/produtos/828768/small-638666887515472668-828768.png',
 'suplementos', ARRAY['Ganho de Massa'], true),

('Creatina HCL 60 Cápsulas', 'Black Skull', '60 cápsulas', 54.90, 69.90, 21,
 'https://cdn.ultrafarma.com.br/static/produtos/828770/small-638666874644120318-828770.png',
 'suplementos', ARRAY['Ganho de Massa'], true),

-- ── VITAMINAS ESPORTIVAS ──────────────────────────────────
('Vitamina C 500mg + Zinco 29mg 60 Cáps', 'Nature Daily', '60 cápsulas', 19.90, 26.90, 26,
 'https://cdn.ultrafarma.com.br/static/produtos/817878/small-638996795600514222-817878_4.png',
 'vitaminas', ARRAY['Vitaminas Esportivas'], true),

('Ômega 3 1000mg 120 Cápsulas', 'Biolab', '120 cápsulas', 39.90, 49.90, 20,
 'https://cdn.ultrafarma.com.br/static/produtos/824418/small-639011705716656618-824418_5.png',
 'vitaminas', ARRAY['Vitaminas Esportivas'], true),

('ZMA 90 Cápsulas', 'Integral Médica', '90 cápsulas', 34.90, 44.90, 22,
 'https://cdn.ultrafarma.com.br/static/produtos/810074/small-638629780678504213-810074_2.png',
 'vitaminas', ARRAY['Vitaminas Esportivas'], true);
