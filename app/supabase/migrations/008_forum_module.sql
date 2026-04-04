-- Migration 008: Módulo de Fórum da Comunidade
-- Cria as tabelas forum_topics e forum_replies com RLS

-- Tabela de Tópicos
CREATE TABLE IF NOT EXISTS public.forum_topics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL CHECK (char_length(title) >= 5 AND char_length(title) <= 150),
  category TEXT NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) >= 10),
  view_count INT DEFAULT 0 NOT NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_closed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Respostas
CREATE TABLE IF NOT EXISTS public.forum_replies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id UUID REFERENCES public.forum_topics(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) >= 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.forum_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_replies ENABLE ROW LEVEL SECURITY;

-- Políticas de Tópicos: leitura pública para autenticados
CREATE POLICY "Membros autenticados podem ler tópicos"
  ON public.forum_topics FOR SELECT
  TO authenticated USING (TRUE);

CREATE POLICY "Membros autenticados podem criar tópicos"
  ON public.forum_topics FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Autor ou admin pode atualizar tópico"
  ON public.forum_topics FOR UPDATE
  TO authenticated USING (auth.uid() = author_id);

-- Políticas de Respostas
CREATE POLICY "Membros autenticados podem ler respostas"
  ON public.forum_replies FOR SELECT
  TO authenticated USING (TRUE);

CREATE POLICY "Membros autenticados podem responder"
  ON public.forum_replies FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = author_id);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_forum_topics_created_at ON public.forum_topics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_replies_topic_id ON public.forum_replies(topic_id);

-- Função para incrementar view_count de forma segura (sem trigger, para chamar via rpc)
CREATE OR REPLACE FUNCTION public.increment_forum_view(topic_id UUID)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.forum_topics
  SET view_count = view_count + 1
  WHERE id = topic_id;
END;
$$;
