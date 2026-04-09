import { z } from 'zod';

// ============ PROFILE ============

export const ProfileSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  display_name: z.string().nullable().optional(),
  email: z.string().email('Email inválido'),
  avatar_url: z.string().url().nullable().optional(),
  bio: z.string().max(500).nullable().optional(),
  role: z.enum(['guest', 'student', 'admin', 'partner', 'talent']).default('student'),
  region_id: z.string().uuid().nullable().optional(),
  phone: z.string().nullable().optional(),
});

export const UpdateProfileSchema = ProfileSchema.pick({
  full_name: true,
  display_name: true,
  bio: true,
  avatar_url: true,
  phone: true,
  region_id: true,
}).partial();

// ============ COURSE ============

export const CourseSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(3, 'Título deve ter no mínimo 3 caracteres'),
  description: z.string().min(10, 'Descrição deve ter no mínimo 10 caracteres').nullable().optional(),
  slug: z.string().min(3),
  thumbnail_url: z.string().url().nullable().optional(),
  level: z.string().default('Iniciante'),
  category_id: z.string().uuid().nullable().optional(),
  total_modules: z.number().int().default(0),
  is_published: z.boolean().default(false),
  instructor_name: z.string().min(2).nullable().optional(),
  instructor_description: z.string().min(10).nullable().optional(),
  instructor_avatar_url: z.string().url().nullable().optional(),
  benefits: z.array(z.string().min(1)).nullable().optional(),
  price: z.number().nonnegative().default(0),
});

export const CreateCourseSchema = CourseSchema.omit({ id: true, slug: true });
export const UpdateCourseSchema = CourseSchema.pick({
  id: true,
  title: true,
  description: true,
  slug: true,
  level: true,
  thumbnail_url: true,
  is_published: true,
  instructor_name: true,
  instructor_description: true,
  instructor_avatar_url: true,
  benefits: true,
  price: true,
}).partial().extend({
  id: z.string().uuid(),
});

// ============ MODULE ============

export const ModuleSchema = z.object({
  id: z.string().uuid(),
  course_id: z.string().uuid(),
  title: z.string().min(2),
  description: z.string().min(5).nullable().optional(),
  order_index: z.number().int().default(0),
});

export const CreateModuleSchema = ModuleSchema.omit({ id: true });
export const UpdateModuleSchema = ModuleSchema.pick({
  id: true,
  course_id: true,
  title: true,
  description: true,
  order_index: true,
}).partial().extend({
  id: z.string().uuid(),
});

// ============ LESSON ============

export const LessonSchema = z.object({
  id: z.string().uuid(),
  module_id: z.string().uuid(),
  title: z.string().min(2),
  description: z.string().min(5).nullable().optional(),
  type: z.enum(['video', 'text', 'quiz']).default('video'),
  content_url: z.string().url().nullable().optional(),
  content_text: z.string().min(1).nullable().optional(),
  coming_soon_image_url: z.string().url().nullable().optional(),
  materials: z.array(
    z.object({
      title: z.string().min(1, 'Titulo do material e obrigatorio'),
      url: z.string().url('URL do material invalida'),
      kind: z.enum(['pdf', 'link', 'download']).default('link'),
    })
  ).nullable().optional(),
  activity_questions: z.array(
    z.object({
      prompt: z.string().min(3, 'A pergunta da atividade precisa ter pelo menos 3 caracteres'),
    }),
  ).nullable().optional(),
  duration_minutes: z.number().int().default(0),
  is_coming_soon: z.boolean().default(false),
  order_index: z.number().int().default(0),
});

export const CreateLessonSchema = LessonSchema.omit({ id: true });
export const UpdateLessonSchema = LessonSchema.pick({
  id: true,
  module_id: true,
  title: true,
  description: true,
  type: true,
  content_url: true,
  content_text: true,
  coming_soon_image_url: true,
  materials: true,
  activity_questions: true,
  duration_minutes: true,
  is_coming_soon: true,
  order_index: true,
}).partial().extend({
  id: z.string().uuid(),
});

// ============ ENROLLMENT ============

export const EnrollmentSchema = z.object({
  id: z.string().uuid(),
  profile_id: z.string().uuid(),
  course_id: z.string().uuid(),
  status: z.enum(['active', 'completed', 'cancelled']).default('active'),
  progress_percent: z.number().min(0).max(100).default(0),
});

export const CreateEnrollmentSchema = z.object({
  course_id: z.string().uuid(),
});

// ============ PROGRESS ============

export const LessonProgressSchema = z.object({
  enrollment_id: z.string().uuid(),
  lesson_id: z.string().uuid(),
  completed: z.boolean().default(false),
  watch_time_seconds: z.number().int().default(0),
});

// ============ OBSERVATORY PROJECT ============

export const ProjectSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  description: z.string().nullable().optional(),
  category: z.enum(['alimentacao', 'saude', 'educacao', 'espiritualidade', 'moradia']),
  status: z.enum(['pending', 'approved', 'rejected']).default('pending'),
  address: z.string().nullable().optional(),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
  contact: z.string().nullable().optional(),
  website: z.string().url().nullable().optional(),
});

export const SubmitProjectSchema = ProjectSchema.pick({
  name: true,
  description: true,
  category: true,
  address: true,
  contact: true,
  website: true,
});

// ============ BLOG POST ============

export const BlogPostSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(3),
  slug: z.string().min(3),
  summary: z.string().nullable().optional(),
  content: z.string().nullable().optional(),
  image_url: z.string().url().nullable().optional(),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  category_id: z.string().uuid().nullable().optional(),
  source: z.string().default('Portal'),
  scheduled_for: z.string().datetime().nullable().optional(),
});

export const CreateBlogPostSchema = BlogPostSchema.omit({ id: true });

// ============ TYPES ============

export type Profile = z.infer<typeof ProfileSchema>;
export type UpdateProfile = z.infer<typeof UpdateProfileSchema>;
export type Course = z.infer<typeof CourseSchema>;
export type Module = z.infer<typeof ModuleSchema>;
export type Lesson = z.infer<typeof LessonSchema>;
export type Enrollment = z.infer<typeof EnrollmentSchema>;
export type LessonProgress = z.infer<typeof LessonProgressSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type BlogPost = z.infer<typeof BlogPostSchema>;
