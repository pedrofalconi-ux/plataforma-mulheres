-- =============================================
-- Ecossistema da Dignidade — Schema Principal
-- Supabase (PostgreSQL)
-- =============================================

-- ============ ENUMS ============

CREATE TYPE user_role AS ENUM ('guest', 'student', 'admin', 'partner', 'talent');
CREATE TYPE project_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE project_category AS ENUM ('alimentacao', 'saude', 'educacao', 'espiritualidade', 'moradia');
CREATE TYPE enrollment_status AS ENUM ('active', 'completed', 'cancelled');
CREATE TYPE lesson_type AS ENUM ('video', 'text', 'quiz');
CREATE TYPE material_type AS ENUM ('pdf', 'link', 'video', 'audio');
CREATE TYPE post_status AS ENUM ('draft', 'published', 'archived');

-- ============ REGIÕES ============

CREATE TABLE regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  state TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'Brasil',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============ PERFIS ============

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  display_name TEXT,
  email TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  role user_role NOT NULL DEFAULT 'student',
  region_id UUID REFERENCES regions(id),
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============ HABILIDADES ============

CREATE TABLE skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE profile_skills (
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
  PRIMARY KEY (profile_id, skill_id)
);

-- ============ CATEGORIAS ============

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============ CURSOS ============

CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  slug TEXT NOT NULL UNIQUE,
  thumbnail_url TEXT,
  level TEXT NOT NULL DEFAULT 'Iniciante',
  category_id UUID REFERENCES categories(id),
  total_modules INT NOT NULL DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type lesson_type NOT NULL DEFAULT 'video',
  content_url TEXT,
  content_text TEXT,
  duration_minutes INT DEFAULT 0,
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type material_type NOT NULL DEFAULT 'pdf',
  url TEXT NOT NULL,
  size_bytes BIGINT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============ MATRÍCULAS E PROGRESSO ============

CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  status enrollment_status NOT NULL DEFAULT 'active',
  progress_percent FLOAT DEFAULT 0,
  enrolled_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  UNIQUE(profile_id, course_id)
);

CREATE TABLE lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  watch_time_seconds INT DEFAULT 0,
  UNIQUE(enrollment_id, lesson_id)
);

CREATE TABLE certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  issued_at TIMESTAMPTZ DEFAULT now(),
  certificate_url TEXT,
  UNIQUE(profile_id, course_id)
);

-- ============ OBSERVATÓRIO ============

CREATE TABLE observatory_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category project_category NOT NULL,
  status project_status NOT NULL DEFAULT 'pending',
  address TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  contact TEXT,
  website TEXT,
  submitted_by UUID REFERENCES profiles(id),
  approved_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============ BLOG ============

CREATE TABLE blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  summary TEXT,
  content TEXT,
  image_url TEXT,
  status post_status NOT NULL DEFAULT 'draft',
  category_id UUID REFERENCES categories(id),
  author_id UUID REFERENCES profiles(id),
  source TEXT DEFAULT 'Portal',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============ EVENTOS (futuro) ============

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ,
  location TEXT,
  is_online BOOLEAN DEFAULT true,
  stream_url TEXT,
  max_attendees INT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE ticket_lots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price_cents INT NOT NULL DEFAULT 0,
  quantity INT NOT NULL,
  available_from TIMESTAMPTZ,
  available_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id UUID NOT NULL REFERENCES ticket_lots(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id),
  code TEXT NOT NULL UNIQUE,
  purchased_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  checked_in_at TIMESTAMPTZ DEFAULT now()
);

-- ============ INDEXES ============

CREATE INDEX idx_courses_category ON courses(category_id);
CREATE INDEX idx_courses_slug ON courses(slug);
CREATE INDEX idx_modules_course ON modules(course_id);
CREATE INDEX idx_lessons_module ON lessons(module_id);
CREATE INDEX idx_enrollments_profile ON enrollments(profile_id);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);
CREATE INDEX idx_lesson_progress_enrollment ON lesson_progress(enrollment_id);
CREATE INDEX idx_observatory_status ON observatory_projects(status);
CREATE INDEX idx_observatory_category ON observatory_projects(category);
CREATE INDEX idx_blog_posts_status ON blog_posts(status);
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_profiles_role ON profiles(role);

-- ============ RLS (Row Level Security) ============

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE observatory_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

-- Profiles: usuário vê o próprio, admin vê todos
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Public profiles are viewable" ON profiles FOR SELECT USING (true);

-- Courses: todos podem ver cursos publicados
CREATE POLICY "Published courses are viewable" ON courses FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can manage courses" ON courses FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Modules/Lessons/Materials: todos podem ver
CREATE POLICY "Modules are viewable" ON modules FOR SELECT USING (true);
CREATE POLICY "Lessons are viewable" ON lessons FOR SELECT USING (true);
CREATE POLICY "Materials are viewable" ON materials FOR SELECT USING (true);

-- Enrollments: usuário vê as próprias
CREATE POLICY "Users view own enrollments" ON enrollments FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "Users can enroll" ON enrollments FOR INSERT WITH CHECK (profile_id = auth.uid());

-- Progress: usuário vê o próprio
CREATE POLICY "Users view own progress" ON lesson_progress FOR SELECT USING (
  EXISTS (SELECT 1 FROM enrollments WHERE id = enrollment_id AND profile_id = auth.uid())
);
CREATE POLICY "Users update own progress" ON lesson_progress FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM enrollments WHERE id = enrollment_id AND profile_id = auth.uid())
);

-- Certificates: usuário vê os próprios
CREATE POLICY "Users view own certificates" ON certificates FOR SELECT USING (profile_id = auth.uid());

-- Observatory: todos podem ver aprovados, qualquer logado pode submeter
CREATE POLICY "Approved projects are public" ON observatory_projects FOR SELECT USING (status = 'approved');
CREATE POLICY "Users can submit projects" ON observatory_projects FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Admins manage projects" ON observatory_projects FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Blog: todos podem ver publicados
CREATE POLICY "Published posts are public" ON blog_posts FOR SELECT USING (status = 'published');
CREATE POLICY "Admins manage posts" ON blog_posts FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============ TRIGGERS ============

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER observatory_updated_at BEFORE UPDATE ON observatory_projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER blog_posts_updated_at BEFORE UPDATE ON blog_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
