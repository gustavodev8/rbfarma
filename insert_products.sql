-- ============================================================
-- RB FARMA — Insert em massa de produtos
-- Cole e execute no SQL Editor do Supabase
-- ============================================================

INSERT INTO products (name, brand, quantity, price, original_price, discount, image_url, category, sections, is_active)
VALUES

-- ── MAIS COMPRADOS ───────────────────────────────────────────
('Dipirona Sódica 500mg', 'Medley', '10 comprimidos', 6.49, 9.99, 35,
 'https://cdn.ultrafarma.com.br/static/produtos/824880/small-638773052502448208-824880_2.png',
 'medicamentos', ARRAY['Mais comprados'], true),

('Dorflex', 'Sanofi', '36 comprimidos', 18.90, 24.90, 24,
 'https://cdn.ultrafarma.com.br/static/produtos/807587/small-639038221268393316-807587_3.jpg',
 'medicamentos', ARRAY['Mais comprados'], true),

('Buscopan Composto', 'Boehringer', '20 comprimidos', 22.90, 29.90, 23,
 'https://cdn.ultrafarma.com.br/static/produtos/3020/small-637702625925350906-3020_9.jpeg',
 'medicamentos', ARRAY['Mais comprados'], true),

('Paracetamol 750mg', 'Dorsanol', '20 comprimidos', 8.99, 12.99, 31,
 'https://cdn.ultrafarma.com.br/static/produtos/180562/small-638895638128960716-180562.png',
 'medicamentos', ARRAY['Mais comprados'], true),

('Vitamina D3 2000UI', 'Maxinutri', '60 cápsulas', 29.90, 39.90, 25,
 'https://cdn.ultrafarma.com.br/static/produtos/815461/small-638974509502307498-815461_4.png',
 'vitaminas', ARRAY['Mais comprados'], true),

('Vitamina C 1000mg', 'Sidney Oliveira', '60 comprimidos', 34.90, 44.90, 22,
 'https://cdn.ultrafarma.com.br/static/produtos/821659/small-639011697542273521-821659_3.png',
 'vitaminas', ARRAY['Mais comprados'], true),

('Protetor Solar FPS 70 Facial', 'Eucerin', '50ml', 59.90, 79.90, 25,
 'https://cdn.ultrafarma.com.br/static/produtos/822261/small-638763662298231774-822261_1.jpg',
 'skincare', ARRAY['Mais comprados'], true),

('Ômega 3 1000mg', 'Sundown', '180 cápsulas', 49.90, 64.90, 23,
 'https://cdn.ultrafarma.com.br/static/produtos/807140/small-638805210576721167-807140_1.jpg',
 'suplementos', ARRAY['Mais comprados'], true),

-- ── OFERTAS IMPERDÍVEIS DO MÊS ───────────────────────────────
('Aspirina 500mg', 'Bayer', '20 comprimidos', 14.90, 19.90, 25,
 'https://cdn.ultrafarma.com.br/static/bf2022/803490.png',
 'medicamentos', ARRAY['Ofertas imperdiveis do mes'], true),

('Neosaldina', 'Takeda', '20 drágeas', 19.90, 25.90, 23,
 'https://cdn.ultrafarma.com.br/static/produtos/11262/small-638798011413123258-11262.png',
 'medicamentos', ARRAY['Ofertas imperdiveis do mes'], true),

('Benegrip Multi', 'Hypera', '16 cápsulas', 18.90, 24.90, 24,
 'https://cdn.ultrafarma.com.br/static/produtos/822262/small-638773905333729552-822262_1.jpg',
 'medicamentos', ARRAY['Ofertas imperdiveis do mes'], true),

('Coenzima Q10 100mg', 'Sidney Oliveira', '60 cápsulas', 44.90, 59.90, 25,
 'https://cdn.ultrafarma.com.br/static/produtos/824419/small-639011793882254476-824419_5.png',
 'suplementos', ARRAY['Ofertas imperdiveis do mes'], true),

('Centrum Mulher', 'Haleon', '60 comprimidos', 59.90, 79.90, 25,
 'https://cdn.ultrafarma.com.br/static/produtos/818075/small-638814407753624040-818075_5.png',
 'vitaminas', ARRAY['Ofertas imperdiveis do mes'], true),

('Magnésio Quelato 400mg', 'Maxinutri', '60 cápsulas', 44.90, 59.90, 25,
 'https://cdn.ultrafarma.com.br/static/produtos/824677/small-638313320816379846-824677.jpg',
 'suplementos', ARRAY['Ofertas imperdiveis do mes'], true),

('Bepantol Derma Creme', 'Bayer', '40g', 32.90, 42.90, 23,
 'https://cdn.ultrafarma.com.br/static/produtos/808134/small-639065224033752800-808134_1.jpg',
 'skincare', ARRAY['Ofertas imperdiveis do mes'], true),

('Protetor Solar Oil Control FPS 60', 'Eucerin', '50ml', 69.90, 89.90, 22,
 'https://cdn.ultrafarma.com.br/static/produtos/808492/small-639076404809444922-808492_1.jpg',
 'skincare', ARRAY['Ofertas imperdiveis do mes'], true),

-- ── MAIS VISTOS ──────────────────────────────────────────────
('Cataflam Pro Emulgel', 'Novartis', '60g', 39.90, 52.90, 25,
 'https://cdn.ultrafarma.com.br/static/produtos/4978/small-638279887282834591-4978_4.jpg',
 'medicamentos', ARRAY['Mais Vistos'], true),

('Centrum Homem', 'Haleon', '60 comprimidos', 59.90, 79.90, 25,
 'https://cdn.ultrafarma.com.br/static/produtos/818075/small-638814407753624040-818075_5.png',
 'vitaminas', ARRAY['Mais Vistos'], true),

('Bepantol Baby Pomada', 'Bayer', '30g', 17.19, 22.39, 23,
 'https://cdn.ultrafarma.com.br/static/produtos/798244/small-639059898612645355-798244_1.jpg',
 'skincare', ARRAY['Mais Vistos'], true),

('Sérum Vitamina C Booster', 'Garnier', '15ml', 29.90, 39.90, 25,
 'https://cdn.ultrafarma.com.br/static/produtos/822284/small-638071625339007099-822284.png',
 'skincare', ARRAY['Mais Vistos'], true),

('Bepantol Derma Hidratante Intenso', 'Bayer', '30g', 39.90, 52.90, 24,
 'https://cdn.ultrafarma.com.br/static/produtos/817908/small-638634046444144845-817908.png',
 'skincare', ARRAY['Mais Vistos'], true),

('Cicaplast Baume B5', 'La Roche-Posay', '20ml', 69.90, 89.90, 22,
 'https://cdn.ultrafarma.com.br/static/produtos/805915/small-637619790308631692-805915_2.jpg',
 'skincare', ARRAY['Mais Vistos'], true),

('Retinol Anti-Idade Noturno', 'La Roche-Posay', '30ml', 119.90, 149.90, 20,
 'https://cdn.ultrafarma.com.br/static/produtos/799350/small-638984013265664485-799350.png',
 'skincare', ARRAY['Mais Vistos'], true),

('Esfoliante Facial Deep Clean', 'Neutrogena', '100g', 31.74, 38.90, 18,
 'https://cdn.ultrafarma.com.br/static/produtos/799333/small-638911439723282172-799333_5.jpg',
 'skincare', ARRAY['Mais Vistos'], true),

-- ── TENDÊNCIAS SKINCARE ASIÁTICO ─────────────────────────────
('Vitamina C Sérum Facial 10%', 'Principia', '30ml', 67.90, 89.90, 24,
 'https://cdn.ultrafarma.com.br/static/produtos/827173/small-638845658803546060-827173_3.png',
 'skincare', ARRAY['Tendencias de skincare asiatico'], true),

('Ácido Hialurônico Sérum Facial', 'Principia', '30ml', 79.90, 99.90, 20,
 'https://cdn.ultrafarma.com.br/static/produtos/827169/small-638845664201960818-827169_2.png',
 'skincare', ARRAY['Tendencias de skincare asiatico'], true),

('Retinol Sérum Facial 0,3%', 'Principia', '30ml', 89.90, 109.90, 18,
 'https://cdn.ultrafarma.com.br/static/produtos/827176/small-638845657025888754-827176_2.png',
 'skincare', ARRAY['Tendencias de skincare asiatico'], true),

('Sérum Niacinamida Clareador', 'Hidraderm', '30ml', 59.90, 79.90, 25,
 'https://cdn.ultrafarma.com.br/static/produtos/818235/small-638512359134193415-818235_4.png',
 'skincare', ARRAY['Tendencias de skincare asiatico'], true),

('Protetor Solar Fusion Water FPS 60', 'Isdin', '50ml', 81.63, 100.04, 18,
 'https://cdn.ultrafarma.com.br/static/produtos/817494/small-638912065274734991-817494_8.jpg',
 'skincare', ARRAY['Tendencias de skincare asiatico'], true),

('Sérum Liftactiv Vitamina C', 'Vichy', '20ml', 99.90, 129.90, 23,
 'https://cdn.ultrafarma.com.br/static/produtos/824741/small-638321298093438851-824741.png',
 'skincare', ARRAY['Tendencias de skincare asiatico'], true),

('Cicaplast Baume B5 Reparador', 'La Roche-Posay', '40ml', 79.90, 99.90, 20,
 'https://cdn.ultrafarma.com.br/static/produtos/801177/small-637619792197975081-801177_3.jpg',
 'skincare', ARRAY['Tendencias de skincare asiatico'], true),

('Sérum Facial Vitamin Activ CG', 'Avène', '30ml', 89.90, 119.90, 25,
 'https://cdn.ultrafarma.com.br/static/produtos/827677/small-638621699052273695-827677_2.png',
 'skincare', ARRAY['Tendencias de skincare asiatico'], true),

-- ── PRODUTOS EM MÚLTIPLAS SEÇÕES ─────────────────────────────
('Vitamina D3 + K2 2000UI', 'Sidney Oliveira', '60 cápsulas', 39.90, 54.90, 27,
 'https://cdn.ultrafarma.com.br/static/produtos/824543/small-639011798972510222-824543_3.png',
 'vitaminas', ARRAY['Mais comprados','Ofertas imperdiveis do mes'], true),

('Ômega 3 TG Odorless 1000mg', 'Sidney Oliveira', '150 cápsulas', 54.90, 74.90, 27,
 'https://cdn.ultrafarma.com.br/static/produtos/820106/small-638953646753643221-820106_3.png',
 'suplementos', ARRAY['Ofertas imperdiveis do mes','Mais Vistos'], true),

('Coenzima Q10 200mg', 'Sidney Oliveira', '60 cápsulas', 59.90, 79.90, 25,
 'https://cdn.ultrafarma.com.br/static/produtos/827639/small-639011906142876983-827639_4.png',
 'suplementos', ARRAY['Mais Vistos','Ofertas imperdiveis do mes'], true),

('Vitamina C + Zinco 1000mg', 'Sidney Oliveira', '60 comprimidos', 43.50, 79.90, 46,
 'https://cdn.ultrafarma.com.br/static/produtos/821659/small-639011697542273521-821659_3.png',
 'vitaminas', ARRAY['Ofertas imperdiveis do mes'], true),

('Bepantol Derma Spray Hidratante', 'Bayer', '50ml', 34.90, 44.90, 22,
 'https://cdn.ultrafarma.com.br/static/produtos/805778/small-638882921485667588-805778_1.jpg',
 'skincare', ARRAY['Mais Vistos','Tendencias de skincare asiatico'], true),

('Protetor Solar Eucerin Pigment Control Tinted', 'Eucerin', '50ml', 89.90, 119.90, 25,
 'https://cdn.ultrafarma.com.br/static/produtos/822261/small-638763662298231774-822261_1.jpg',
 'skincare', ARRAY['Tendencias de skincare asiatico','Mais Vistos'], true),

('Neosaldina 30 Drágeas', 'Takeda', '30 drágeas', 26.90, 34.90, 23,
 'https://cdn.ultrafarma.com.br/static/produtos/800032/small-638405239008113295-800032_5.jpg',
 'medicamentos', ARRAY['Mais comprados','Ofertas imperdiveis do mes'], true),

('Magnésio Quelato + Zinco + Selênio', 'Maxinutri', '60 cápsulas', 49.90, 64.90, 23,
 'https://cdn.ultrafarma.com.br/static/produtos/824676/small-638313316327237763-824676.jpg',
 'suplementos', ARRAY['Mais comprados','Mais Vistos'], true);

-- ============================================================
-- Fim do script — 40 produtos inseridos
-- ============================================================
