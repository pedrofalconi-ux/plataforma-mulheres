-- Migration: Add course customization fields and shopping cart table

-- 1. Course Customization Fields
ALTER TABLE courses
ADD COLUMN IF NOT EXISTS instructor_name TEXT DEFAULT 'Especialistas do Ecossistema',
ADD COLUMN IF NOT EXISTS instructor_description TEXT DEFAULT 'Nossa equipe de especialistas da área que produz os melhores conteúdos focados no cuidado para a dignidade humana.',
ADD COLUMN IF NOT EXISTS instructor_avatar_url TEXT,
ADD COLUMN IF NOT EXISTS benefits JSONB DEFAULT '["Fundamentos teóricos e práticos aplicados.", "Acesso a metodologias exclusivas do Ecossistema.", "Avaliações progressivas de conhecimento.", "Certificado de conclusão reconhecido."]'::jsonb;

-- 2. Shopping Cart Table
CREATE TABLE IF NOT EXISTS cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(profile_id, course_id)
);

-- Enable RLS for cart_items
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own cart items"
    ON cart_items FOR SELECT
    USING (auth.uid() = profile_id);

CREATE POLICY "Users can insert their own cart items"
    ON cart_items FOR INSERT
    WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can delete their own cart items"
    ON cart_items FOR DELETE
    USING (auth.uid() = profile_id);

CREATE POLICY "Admins have full access to cart_items"
    ON cart_items FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
