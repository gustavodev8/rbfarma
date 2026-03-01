-- ============================================================
-- RB FARMA — Tabelas de pedidos, perfis e itens
-- Execute no SQL Editor do Supabase
-- ============================================================

-- ── 1. Perfis de usuário (estende auth.users) ──────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id         UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name       TEXT NOT NULL DEFAULT '',
  cpf        TEXT,
  phone      TEXT,
  birth_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Trigger: cria perfil automaticamente quando novo usuário se cadastra
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── 2. Pedidos ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id                   UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id              UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Número legível
  order_number         TEXT UNIQUE NOT NULL
                         DEFAULT 'RB-' || UPPER(SUBSTR(gen_random_uuid()::TEXT, 1, 8)),

  -- Dados do cliente (pode ser guest)
  customer_name        TEXT NOT NULL,
  customer_email       TEXT NOT NULL,
  customer_cpf         TEXT NOT NULL,
  customer_phone       TEXT NOT NULL,

  -- Endereço de entrega
  shipping_cep         TEXT NOT NULL,
  shipping_address     TEXT NOT NULL,
  shipping_number      TEXT NOT NULL,
  shipping_complement  TEXT,
  shipping_neighborhood TEXT,
  shipping_city        TEXT NOT NULL,
  shipping_state       TEXT NOT NULL,

  -- Pagamento
  payment_method       TEXT NOT NULL
                         CHECK (payment_method IN ('pix','credit','boleto')),
  payment_installments INTEGER DEFAULT 1,

  -- Valores
  subtotal             NUMERIC(10,2) NOT NULL,
  discount             NUMERIC(10,2) DEFAULT 0,
  shipping_cost        NUMERIC(10,2) DEFAULT 0,
  total                NUMERIC(10,2) NOT NULL,

  -- Status
  status               TEXT DEFAULT 'pending'
                         CHECK (status IN ('pending','processing','shipped','delivered','cancelled')),

  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Qualquer um pode criar pedido (guest checkout)
CREATE POLICY "orders_insert_any" ON orders
  FOR INSERT WITH CHECK (true);

-- Usuário vê apenas seus próprios pedidos
CREATE POLICY "orders_select_own" ON orders
  FOR SELECT USING (
    auth.uid() = user_id
    OR user_id IS NULL  -- pedidos guest ficam acessíveis pelo order_id
  );

-- ── 3. Itens do pedido ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id         UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_id       TEXT NOT NULL,
  product_name     TEXT NOT NULL,
  product_image    TEXT,
  product_brand    TEXT,
  product_quantity TEXT,
  unit_price       NUMERIC(10,2) NOT NULL,
  quantity         INTEGER NOT NULL,
  total            NUMERIC(10,2) NOT NULL
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "order_items_insert_any" ON order_items
  FOR INSERT WITH CHECK (true);

CREATE POLICY "order_items_select_via_order" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND (orders.user_id = auth.uid() OR orders.user_id IS NULL)
    )
  );

-- ── 4. Índices ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS orders_user_id_idx    ON orders (user_id);
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders (created_at DESC);
CREATE INDEX IF NOT EXISTS order_items_order_idx ON order_items (order_id);
