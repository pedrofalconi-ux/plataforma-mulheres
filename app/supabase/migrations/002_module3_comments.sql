-- =============================================
-- Módulo 3: Plataforma Educacional
-- Migração Tabela de Comentários / Dúvidas
-- =============================================

CREATE TABLE IF NOT EXISTS lesson_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES lesson_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lesson_comments_lesson ON lesson_comments(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_comments_parent ON lesson_comments(parent_id);

-- ============ RLS (Row Level Security) ============

ALTER TABLE lesson_comments ENABLE ROW LEVEL SECURITY;

-- 1. Qualquer usuário autenticado (ou até público, dependendo do curso) pode ver os comentários.
-- Vamos restringir leitura para quem ao menos está logado, ou deixar global.
CREATE POLICY "Comments are viewable by everyone" ON lesson_comments FOR SELECT USING (true);

-- 2. Apenas usuários logados podem inserir dúvidas.
CREATE POLICY "Authenticated users can insert comments" ON lesson_comments FOR INSERT WITH CHECK (auth.uid() = profile_id);

-- 3. Usuário pode editar seu próprio comentário.
CREATE POLICY "Users can update own comments" ON lesson_comments FOR UPDATE USING (auth.uid() = profile_id);

-- 4. Admin pode gerenciar todos.
CREATE POLICY "Admins manage all comments" ON lesson_comments FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============ TRIGGERS ============

-- Auto-update updated_at caso tenha a função definida no 001
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at') THEN
    CREATE TRIGGER lesson_comments_updated_at 
      BEFORE UPDATE ON lesson_comments 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;
