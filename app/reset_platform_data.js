const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL;

if (!connectionString || connectionString.includes('[YOUR-DB-PASSWORD]')) {
  throw new Error('Defina DATABASE_URL com a senha real do banco antes de executar este script.');
}

const resetSql = `
DO $$
BEGIN
  IF to_regclass('public.audit_logs') IS NOT NULL THEN TRUNCATE TABLE public.audit_logs RESTART IDENTITY CASCADE; END IF;
  IF to_regclass('public.certificates') IS NOT NULL THEN TRUNCATE TABLE public.certificates RESTART IDENTITY CASCADE; END IF;
  IF to_regclass('public.checkout_order_items') IS NOT NULL THEN TRUNCATE TABLE public.checkout_order_items RESTART IDENTITY CASCADE; END IF;
  IF to_regclass('public.checkout_orders') IS NOT NULL THEN TRUNCATE TABLE public.checkout_orders RESTART IDENTITY CASCADE; END IF;
  IF to_regclass('public.cart_items') IS NOT NULL THEN TRUNCATE TABLE public.cart_items RESTART IDENTITY CASCADE; END IF;
  IF to_regclass('public.checkins') IS NOT NULL THEN TRUNCATE TABLE public.checkins RESTART IDENTITY CASCADE; END IF;
  IF to_regclass('public.ticket_lots') IS NOT NULL THEN TRUNCATE TABLE public.ticket_lots RESTART IDENTITY CASCADE; END IF;
  IF to_regclass('public.tickets') IS NOT NULL THEN TRUNCATE TABLE public.tickets RESTART IDENTITY CASCADE; END IF;
  IF to_regclass('public.lesson_comments') IS NOT NULL THEN TRUNCATE TABLE public.lesson_comments RESTART IDENTITY CASCADE; END IF;
  IF to_regclass('public.lesson_progress') IS NOT NULL THEN TRUNCATE TABLE public.lesson_progress RESTART IDENTITY CASCADE; END IF;
  IF to_regclass('public.materials') IS NOT NULL THEN TRUNCATE TABLE public.materials RESTART IDENTITY CASCADE; END IF;
  IF to_regclass('public.lessons') IS NOT NULL THEN TRUNCATE TABLE public.lessons RESTART IDENTITY CASCADE; END IF;
  IF to_regclass('public.modules') IS NOT NULL THEN TRUNCATE TABLE public.modules RESTART IDENTITY CASCADE; END IF;
  IF to_regclass('public.enrollments') IS NOT NULL THEN TRUNCATE TABLE public.enrollments RESTART IDENTITY CASCADE; END IF;
  IF to_regclass('public.courses') IS NOT NULL THEN TRUNCATE TABLE public.courses RESTART IDENTITY CASCADE; END IF;
  IF to_regclass('public.forum_replies') IS NOT NULL THEN TRUNCATE TABLE public.forum_replies RESTART IDENTITY CASCADE; END IF;
  IF to_regclass('public.forum_topics') IS NOT NULL THEN TRUNCATE TABLE public.forum_topics RESTART IDENTITY CASCADE; END IF;
  IF to_regclass('public.blog_posts') IS NOT NULL THEN TRUNCATE TABLE public.blog_posts RESTART IDENTITY CASCADE; END IF;
  IF to_regclass('public.observatory_projects') IS NOT NULL THEN TRUNCATE TABLE public.observatory_projects RESTART IDENTITY CASCADE; END IF;
  IF to_regclass('public.events') IS NOT NULL THEN TRUNCATE TABLE public.events RESTART IDENTITY CASCADE; END IF;
  IF to_regclass('public.profile_skills') IS NOT NULL THEN TRUNCATE TABLE public.profile_skills RESTART IDENTITY CASCADE; END IF;
  IF to_regclass('public.profiles') IS NOT NULL THEN TRUNCATE TABLE public.profiles RESTART IDENTITY CASCADE; END IF;
  IF to_regclass('auth.identities') IS NOT NULL THEN DELETE FROM auth.identities; END IF;
  IF to_regclass('auth.sessions') IS NOT NULL THEN DELETE FROM auth.sessions; END IF;
  IF to_regclass('auth.refresh_tokens') IS NOT NULL THEN DELETE FROM auth.refresh_tokens; END IF;
  IF to_regclass('auth.one_time_tokens') IS NOT NULL THEN DELETE FROM auth.one_time_tokens; END IF;
  IF to_regclass('auth.mfa_factors') IS NOT NULL THEN DELETE FROM auth.mfa_factors; END IF;
  IF to_regclass('auth.mfa_challenges') IS NOT NULL THEN DELETE FROM auth.mfa_challenges; END IF;
  IF to_regclass('auth.mfa_amr_claims') IS NOT NULL THEN DELETE FROM auth.mfa_amr_claims; END IF;
  IF to_regclass('auth.users') IS NOT NULL THEN DELETE FROM auth.users; END IF;
END $$;

INSERT INTO public.institutional_content (
  id,
  hero_title,
  hero_subtitle,
  about_summary,
  mission,
  vision,
  values,
  updated_by,
  updated_at
)
VALUES (
  TRUE,
  'Nathi Faria',
  'Aprendizagem viva, casa com direcao e uma presenca mais intencional no cotidiano.',
  'A plataforma conecta formacao, presenca e conteudo com uma linguagem mais serena, madura e feminina.',
  'Cultivar jornadas de aprendizagem que fortalecam o lar, a presenca e a clareza na vida cotidiana.',
  'Ser uma referencia em formacao feminina com estetica, profundidade e direcao.',
  ARRAY['Clareza', 'Cuidado', 'Presenca', 'Responsabilidade', 'Beleza'],
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  hero_title = EXCLUDED.hero_title,
  hero_subtitle = EXCLUDED.hero_subtitle,
  about_summary = EXCLUDED.about_summary,
  mission = EXCLUDED.mission,
  vision = EXCLUDED.vision,
  values = EXCLUDED.values,
  updated_by = EXCLUDED.updated_by,
  updated_at = EXCLUDED.updated_at;
`;

async function main() {
  const client = new Client({ connectionString });

  try {
    await client.connect();
    await client.query(resetSql);

    const result = await client.query(`
      select
        (select count(*)::int from auth.users) as auth_users,
        (select count(*)::int from public.profiles) as profiles,
        (select count(*)::int from public.courses) as courses,
        (select count(*)::int from public.modules) as modules,
        (select count(*)::int from public.lessons) as lessons,
        (select count(*)::int from public.materials) as materials,
        (select count(*)::int from public.institutional_content) as institutional_content;
    `);

    console.log(JSON.stringify(result.rows[0], null, 2));
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
