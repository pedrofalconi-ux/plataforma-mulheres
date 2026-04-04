-- =============================================
-- Módulo 4+: Conclusão de escopo contratual
-- Conteúdo institucional, checkout e blog agendado
-- =============================================

-- ============ INSTITUCIONAL (CMS) ============

CREATE TABLE IF NOT EXISTS institutional_content (
  id BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (id = TRUE),
  hero_title TEXT NOT NULL DEFAULT 'Ecossistema da Dignidade',
  hero_subtitle TEXT NOT NULL DEFAULT 'Educação, comunidade e iniciativas sociais em um único lugar.',
  about_summary TEXT NOT NULL DEFAULT 'A plataforma conecta formação, participação comunitária e impacto social com foco na dignidade humana.',
  mission TEXT NOT NULL DEFAULT 'Fortalecer a dignidade humana por meio da educação, da ação social e da integração comunitária.',
  vision TEXT NOT NULL DEFAULT 'Ser referência em soberania digital para comunidades e iniciativas solidárias.',
  values TEXT[] NOT NULL DEFAULT ARRAY[
    'Verdade',
    'Solidariedade',
    'Responsabilidade',
    'Excelência',
    'Acolhimento'
  ],
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO institutional_content (id)
VALUES (TRUE)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE institutional_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Institutional content is public" ON institutional_content;
CREATE POLICY "Institutional content is public"
  ON institutional_content FOR SELECT
  USING (TRUE);

DROP POLICY IF EXISTS "Admins manage institutional content" ON institutional_content;
CREATE POLICY "Admins manage institutional content"
  ON institutional_content FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============ BLOG AGENDADO ============

ALTER TABLE blog_posts
  ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_blog_posts_scheduled_for ON blog_posts(scheduled_for);

-- ============ CHECKOUT UNIFICADO ============

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'checkout_item_type') THEN
    CREATE TYPE checkout_item_type AS ENUM ('course', 'event_ticket');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS checkout_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'confirmed',
  total_cents INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS checkout_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES checkout_orders(id) ON DELETE CASCADE,
  item_type checkout_item_type NOT NULL,
  reference_id UUID NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price_cents INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_checkout_orders_profile ON checkout_orders(profile_id);
CREATE INDEX IF NOT EXISTS idx_checkout_items_order ON checkout_order_items(order_id);

ALTER TABLE checkout_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkout_order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own checkout orders" ON checkout_orders;
CREATE POLICY "Users can view own checkout orders"
  ON checkout_orders FOR SELECT
  USING (profile_id = auth.uid());

DROP POLICY IF EXISTS "Users can create own checkout orders" ON checkout_orders;
CREATE POLICY "Users can create own checkout orders"
  ON checkout_orders FOR INSERT
  WITH CHECK (profile_id = auth.uid());

DROP POLICY IF EXISTS "Users can view own checkout items" ON checkout_order_items;
CREATE POLICY "Users can view own checkout items"
  ON checkout_order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM checkout_orders
      WHERE checkout_orders.id = checkout_order_items.order_id
      AND checkout_orders.profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create own checkout items" ON checkout_order_items;
CREATE POLICY "Users can create own checkout items"
  ON checkout_order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM checkout_orders
      WHERE checkout_orders.id = checkout_order_items.order_id
      AND checkout_orders.profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins manage checkout tables" ON checkout_orders;
CREATE POLICY "Admins manage checkout tables"
  ON checkout_orders FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admins manage checkout item tables" ON checkout_order_items;
CREATE POLICY "Admins manage checkout item tables"
  ON checkout_order_items FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
