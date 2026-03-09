-- ============================================================
-- migration_v3.sql — Sistema de Papéis e Permissões
-- Execute no Supabase → SQL Editor
-- ============================================================

-- Tabela de papéis e permissões de usuário
CREATE TABLE IF NOT EXISTS user_roles (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role           TEXT NOT NULL CHECK (role IN ('admin', 'colaborador')),
  colaborador_id UUID REFERENCES colaboradores(id) ON DELETE SET NULL,
  permissoes     TEXT[] NOT NULL DEFAULT '{}',
  ativo          BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Qualquer usuário autenticado pode LER todos os registros
-- (o admin precisa ver as permissões dos colaboradores que gerencia)
CREATE POLICY "user_roles_select"
  ON user_roles FOR SELECT
  TO authenticated
  USING (true);

-- Qualquer usuário autenticado pode ATUALIZAR registros existentes
-- (admin atualiza permissoes/ativo dos colaboradores via frontend)
CREATE POLICY "user_roles_update"
  ON user_roles FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- INSERT e DELETE são feitos apenas pela edge function com service role
-- (evita criação de contas não autorizadas pelo frontend)
