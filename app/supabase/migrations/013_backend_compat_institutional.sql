-- =============================================
-- Migration 013: Backend compatibility
-- Ensures institutional CMS table exists in legacy projects
-- =============================================

CREATE TABLE IF NOT EXISTS public.institutional_content (
  id BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (id = TRUE),
  hero_title TEXT NOT NULL DEFAULT 'Nathi Faria',
  hero_subtitle TEXT NOT NULL DEFAULT 'Aprendizagem viva, casa com direcao e uma presenca mais intencional no cotidiano.',
  about_summary TEXT NOT NULL DEFAULT 'A plataforma conecta formacao, presenca e conteudo com uma linguagem mais serena, madura e feminina.',
  mission TEXT NOT NULL DEFAULT 'Cultivar jornadas de aprendizagem que fortaleçam o lar, a presenca e a clareza na vida cotidiana.',
  vision TEXT NOT NULL DEFAULT 'Ser uma referencia em formacao feminina com estetica, profundidade e direcao.',
  values TEXT[] NOT NULL DEFAULT ARRAY[
    'Clareza',
    'Cuidado',
    'Presenca',
    'Responsabilidade',
    'Beleza'
  ],
  updated_by UUID REFERENCES public.profiles(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.institutional_content (id)
VALUES (TRUE)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.institutional_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Institutional content is public" ON public.institutional_content;
CREATE POLICY "Institutional content is public"
  ON public.institutional_content FOR SELECT
  USING (TRUE);

DROP POLICY IF EXISTS "Admins manage institutional content" ON public.institutional_content;
CREATE POLICY "Admins manage institutional content"
  ON public.institutional_content FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );
