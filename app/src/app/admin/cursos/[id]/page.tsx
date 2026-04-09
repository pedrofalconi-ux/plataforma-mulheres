'use client';

import React, { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FileText, Image as ImageIcon, Link as LinkIcon, Loader2, Lock, Paperclip, Play, Plus, Save, Settings, Trash2, Upload, Video, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import ImageCropper from '@/components/admin/ImageCropper';

const YOUTUBE_URL_PATTERN =
  /(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/;

type LessonMaterial = {
  clientId: string;
  title: string;
  url: string;
  kind: 'pdf' | 'link' | 'download';
};

type ActivityQuestion = {
  clientId: string;
  prompt: string;
};

type LessonDraft = {
  title: string;
  description: string;
  type: 'video' | 'text';
  content_url: string;
  coming_soon_image_url: string;
  duration_minutes: number;
  is_coming_soon: boolean;
  materials: LessonMaterial[];
  activity_questions: ActivityQuestion[];
};

function makeClientId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeLessonMaterials(materials: any[] = []): LessonMaterial[] {
  return materials.map((material) => ({
    clientId: makeClientId(),
    title: material?.title || '',
    url: material?.url || '',
    kind: material?.kind === 'pdf' || material?.kind === 'download' ? material.kind : 'link',
  }));
}

function normalizeActivityQuestions(questions: any[] = []): ActivityQuestion[] {
  return questions.map((question) => ({
    clientId: makeClientId(),
    prompt: question?.prompt || '',
  }));
}

const emptyLessonDraft = (): LessonDraft => ({
  title: '',
  description: '',
  type: 'video',
  content_url: '',
  coming_soon_image_url: '',
  duration_minutes: 0,
  is_coming_soon: false,
  materials: [],
  activity_questions: [],
});

export default function CourseBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const supabase = createClient();
  const resolvedParams = use(params);
  const courseId = resolvedParams.id;

  const [course, setCourse] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'content' | 'settings'>('content');

  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    level: 'Iniciante',
    thumbnail_url: '',
    instructor_name: '',
    instructor_description: '',
    instructor_avatar_url: '',
    benefits: '',
  });

  const [showModuleModal, setShowModuleModal] = useState(false);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [moduleTitle, setModuleTitle] = useState('');
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [lessonData, setLessonData] = useState<LessonDraft>(emptyLessonDraft);

  const [isSavingCourse, setIsSavingCourse] = useState(false);
  const [isSavingModule, setIsSavingModule] = useState(false);
  const [isSavingLesson, setIsSavingLesson] = useState(false);
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
  const [isUploadingInstructorAvatar, setIsUploadingInstructorAvatar] = useState(false);
  const [isUploadingLessonContent, setIsUploadingLessonContent] = useState(false);
  const [isUploadingLessonMaterial, setIsUploadingLessonMaterial] = useState(false);
  const [isUploadingComingSoonImage, setIsUploadingComingSoonImage] = useState(false);
  const [isDetectingLessonDuration, setIsDetectingLessonDuration] = useState(false);
  const [lessonDurationStatus, setLessonDurationStatus] = useState('');

  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [cropperTarget, setCropperTarget] = useState<'thumbnail' | 'instructor'>('thumbnail');

  const isYouTubeLessonUrl = useMemo(
    () => lessonData.type === 'video' && YOUTUBE_URL_PATTERN.test(lessonData.content_url),
    [lessonData.content_url, lessonData.type],
  );

  const parseResponse = async (response: Response) => {
    const rawText = await response.text();

    try {
      return rawText ? JSON.parse(rawText) : {};
    } catch {
      return { error: rawText || 'Resposta invalida da API.' };
    }
  };

  const getLessonMaterials = (lesson: any) => (Array.isArray(lesson?.materials) ? lesson.materials : []);

  const uploadCourseAsset = async (file: File, assetType: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('courseId', courseId);
    formData.append('assetType', assetType);

    const response = await fetch('/api/admin/uploads', {
      method: 'POST',
      body: formData,
    });

    const data = await parseResponse(response);
    if (!response.ok) {
      throw new Error(data.error || 'Falha ao enviar arquivo.');
    }

    return data.url as string;
  };

  const uploadImageField = async (file: File | null, target: 'thumbnail' | 'instructor') => {
    if (!file) return;

    const setLoading = target === 'thumbnail' ? setIsUploadingThumbnail : setIsUploadingInstructorAvatar;
    const field = target === 'thumbnail' ? 'thumbnail_url' : 'instructor_avatar_url';

    try {
      setLoading(true);
      const uploadedUrl = await uploadCourseAsset(file, target === 'thumbnail' ? 'thumbnail' : 'instructor-avatar');
      setCourseForm((current) => ({ ...current, [field]: uploadedUrl }));
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Falha ao enviar imagem.');
    } finally {
      setLoading(false);
    }
  };

  const handleLessonContentUpload = async (file: File | null) => {
    if (!file) return;

    try {
      setIsUploadingLessonContent(true);
      const uploadedUrl = await uploadCourseAsset(file, 'lesson-content');
      setLessonData((current) => ({ ...current, content_url: uploadedUrl }));
      setLessonDurationStatus('Arquivo principal enviado com sucesso.');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Falha ao enviar arquivo principal.');
    } finally {
      setIsUploadingLessonContent(false);
    }
  };

  const handleLessonMaterialUpload = async (file: File | null) => {
    if (!file) return;

    try {
      setIsUploadingLessonMaterial(true);
      const uploadedUrl = await uploadCourseAsset(file, 'lesson-material');
      const extension = file.name.split('.').pop()?.toLowerCase();

      setLessonData((current) => ({
        ...current,
        materials: [
          ...current.materials,
          {
            clientId: makeClientId(),
            title: file.name.replace(/\.[^.]+$/, '') || 'Material complementar',
            url: uploadedUrl,
            kind: extension === 'pdf' ? 'pdf' : 'download',
          },
        ],
      }));
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Falha ao enviar material.');
    } finally {
      setIsUploadingLessonMaterial(false);
    }
  };

  const handleComingSoonImageUpload = async (file: File | null) => {
    if (!file) return;

    try {
      setIsUploadingComingSoonImage(true);
      const uploadedUrl = await uploadCourseAsset(file, 'lesson-coming-soon');
      setLessonData((current) => ({ ...current, coming_soon_image_url: uploadedUrl }));
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Falha ao enviar imagem da aula.');
    } finally {
      setIsUploadingComingSoonImage(false);
    }
  };

  const updateLessonMaterialTitle = (clientId: string, title: string) => {
    setLessonData((current) => ({
      ...current,
      materials: current.materials.map((material) =>
        material.clientId === clientId ? { ...material, title } : material,
      ),
    }));
  };

  const removeLessonMaterial = (clientId: string) => {
    setLessonData((current) => ({
      ...current,
      materials: current.materials.filter((material) => material.clientId !== clientId),
    }));
  };

  const resetLessonModal = () => {
    setLessonData(emptyLessonDraft());
    setLessonDurationStatus('');
    setEditingLessonId(null);
  };

  const addLessonQuestion = () => {
    setLessonData((current) => ({
      ...current,
      activity_questions: [...current.activity_questions, { clientId: makeClientId(), prompt: '' }],
    }));
  };

  const updateLessonQuestion = (clientId: string, prompt: string) => {
    setLessonData((current) => ({
      ...current,
      activity_questions: current.activity_questions.map((question) =>
        question.clientId === clientId ? { ...question, prompt } : question,
      ),
    }));
  };

  const removeLessonQuestion = (clientId: string) => {
    setLessonData((current) => ({
      ...current,
      activity_questions: current.activity_questions.filter((question) => question.clientId !== clientId),
    }));
  };

  const openCreateLessonModal = (moduleId: string) => {
    setActiveModuleId(moduleId);
    resetLessonModal();
    setShowLessonModal(true);
  };

  const openEditLessonModal = (moduleId: string, lesson: any) => {
    setActiveModuleId(moduleId);
    setEditingLessonId(lesson.id);
    setLessonData({
      title: lesson.title || '',
      description: lesson.description || '',
      type: lesson.type === 'text' ? 'text' : 'video',
      content_url: lesson.content_url || '',
      coming_soon_image_url: lesson.coming_soon_image_url || '',
      duration_minutes: lesson.duration_minutes || 0,
      is_coming_soon: Boolean(lesson.is_coming_soon),
      materials: normalizeLessonMaterials(getLessonMaterials(lesson)),
      activity_questions: normalizeActivityQuestions(Array.isArray(lesson.activity_questions) ? lesson.activity_questions : []),
    });
    setLessonDurationStatus('');
    setShowLessonModal(true);
  };

  const fetchCourseData = async () => {
    const { data: loadedCourse } = await supabase.from('courses').select('*').eq('id', courseId).single();
    if (loadedCourse) {
      setCourse(loadedCourse);

      let parsedBenefits =
        loadedCourse.benefits ||
        '[\n  "Fundamentos teoricos e praticos aplicados.",\n  "Acesso a materiais complementares em PDF.",\n  "Organizacao clara por modulos e aulas.",\n  "Experiencia de aprendizado mais limpa."\n]';

      if (typeof parsedBenefits !== 'string') {
        parsedBenefits = JSON.stringify(parsedBenefits, null, 2);
      }

      setCourseForm({
        title: loadedCourse.title || '',
        description: loadedCourse.description || '',
        level: loadedCourse.level || 'Iniciante',
        thumbnail_url: loadedCourse.thumbnail_url || '',
        instructor_name: loadedCourse.instructor_name || '',
        instructor_description: loadedCourse.instructor_description || '',
        instructor_avatar_url: loadedCourse.instructor_avatar_url || '',
        benefits: parsedBenefits,
      });
    }

    const modulesWithMaterials = await supabase
      .from('modules')
      .select('id, title, order_index, lessons(id, title, description, type, content_url, coming_soon_image_url, duration_minutes, is_coming_soon, order_index, materials, activity_questions)')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });

    const { data: loadedModules } = modulesWithMaterials.error
      ? await supabase
          .from('modules')
          .select('id, title, order_index, lessons(id, title, description, type, content_url, coming_soon_image_url, duration_minutes, is_coming_soon, order_index, activity_questions)')
          .eq('course_id', courseId)
          .order('order_index', { ascending: true })
      : modulesWithMaterials;

    if (loadedModules) {
      setModules(
        loadedModules.map((module: any) => ({
          ...module,
          lessons: (module.lessons || []).sort(
            (first: any, second: any) => (first.order_index ?? 0) - (second.order_index ?? 0),
          ),
        })),
      );
    }

    setLoading(false);
  };

  useEffect(() => {
    void fetchCourseData();
  }, [courseId]);

  useEffect(() => {
    if (!showLessonModal) return;

    const trimmedUrl = lessonData.content_url.trim();
    if (lessonData.type !== 'video' || !trimmedUrl || !YOUTUBE_URL_PATTERN.test(trimmedUrl)) {
      setIsDetectingLessonDuration(false);
      setLessonDurationStatus('');
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        setIsDetectingLessonDuration(true);
        setLessonDurationStatus('Detectando duracao do video...');

        const response = await fetch(`/api/admin/youtube-metadata?url=${encodeURIComponent(trimmedUrl)}`);
        const result = await parseResponse(response);
        if (!response.ok) {
          throw new Error(result.error || 'Nao foi possivel detectar a duracao automaticamente.');
        }

        const durationMinutes = Number(result.duration_minutes || 0);
        if (durationMinutes > 0) {
          setLessonData((current) => ({ ...current, duration_minutes: durationMinutes }));
          setLessonDurationStatus(`Duracao detectada automaticamente: ${durationMinutes} min`);
        } else {
          throw new Error('O YouTube nao retornou a duracao deste video.');
        }
      } catch (error) {
        setLessonDurationStatus(
          error instanceof Error ? error.message : 'Nao foi possivel detectar a duracao automaticamente.',
        );
      } finally {
        setIsDetectingLessonDuration(false);
      }
    }, 700);

    return () => {
      window.clearTimeout(timer);
    };
  }, [lessonData.content_url, lessonData.type, showLessonModal]);

  const handleTogglePublish = async () => {
    try {
      const response = await fetch('/api/admin/courses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: courseId, is_published: !course?.is_published }),
      });

      const data = await parseResponse(response);
      if (!response.ok) throw new Error(data.error || 'Erro ao atualizar status');
      setCourse((current: any) => ({ ...current, is_published: !current.is_published }));
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erro ao mudar status do curso.');
    }
  };

  const handleSaveSettings = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSavingCourse(true);

    let finalBenefits;
    try {
      finalBenefits = JSON.parse(courseForm.benefits || '[]');
    } catch {
      alert('O campo de beneficios deve ser um JSON valido.');
      setIsSavingCourse(false);
      return;
    }

    try {
      const response = await fetch('/api/admin/courses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: courseId,
          title: courseForm.title,
          description: courseForm.description,
          level: courseForm.level,
          thumbnail_url: courseForm.thumbnail_url,
          instructor_name: courseForm.instructor_name,
          instructor_description: courseForm.instructor_description,
          instructor_avatar_url: courseForm.instructor_avatar_url,
          benefits: finalBenefits,
        }),
      });

      const data = await parseResponse(response);
      if (!response.ok) throw new Error(data.error || 'Erro ao salvar as configuracoes.');
      alert('Configuracoes do bloco salvas com sucesso.');
      void fetchCourseData();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsSavingCourse(false);
    }
  };

  const handleCreateModule = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!moduleTitle.trim() || isSavingModule) return;

    setIsSavingModule(true);

    try {
      const response = await fetch('/api/admin/modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: courseId,
          title: moduleTitle,
          order_index: modules.length,
        }),
      });

      const data = await parseResponse(response);
      if (!response.ok) throw new Error(data.error || 'Erro ao criar modulo');

      setModules((current) => [...current, { ...data, lessons: [] }]);
      setModuleTitle('');
      setShowModuleModal(false);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsSavingModule(false);
    }
  };

  const handleSaveLesson = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!lessonData.title || !activeModuleId || isSavingLesson) return;

    if (!lessonData.is_coming_soon && lessonData.type === 'video' && !lessonData.content_url.trim()) {
      alert('Informe a URL do video no YouTube.');
      return;
    }

    if (!lessonData.is_coming_soon && lessonData.type !== 'video' && !lessonData.content_url.trim()) {
      alert('Envie o arquivo principal da aula.');
      return;
    }

    setIsSavingLesson(true);

    try {
      const targetModule = modules.find((module) => module.id === activeModuleId);
      const existingLesson = targetModule?.lessons.find((lesson: any) => lesson.id === editingLessonId);
      const lessonOrderIndex = existingLesson?.order_index ?? (targetModule ? targetModule.lessons.length : 0);
      const cleanQuestions = lessonData.activity_questions
        .map((question) => ({ prompt: question.prompt.trim() }))
        .filter((question) => question.prompt.length > 0);

      const cleanMaterials = lessonData.materials.map(({ clientId, ...material }) => material);

      const response = await fetch('/api/admin/lessons', {
        method: editingLessonId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(editingLessonId ? { id: editingLessonId } : {}),
          module_id: activeModuleId,
          title: lessonData.title,
          description: lessonData.description,
          type: lessonData.type,
          content_url: lessonData.is_coming_soon ? '' : lessonData.content_url,
          coming_soon_image_url: lessonData.is_coming_soon ? lessonData.coming_soon_image_url : '',
          materials: cleanMaterials,
          activity_questions: cleanQuestions,
          duration_minutes: lessonData.is_coming_soon ? 0 : lessonData.duration_minutes || 0,
          is_coming_soon: lessonData.is_coming_soon,
          order_index: lessonOrderIndex,
        }),
      });

      const data = await parseResponse(response);
      if (!response.ok) throw new Error(data.error || 'Erro ao salvar aula');

      await fetchCourseData();
      setShowLessonModal(false);
      resetLessonModal();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsSavingLesson(false);
    }
  };

  const deleteLesson = async (id: string) => {
    if (!confirm('Apagar esta aula?')) return;

    try {
      const response = await fetch(`/api/admin/lessons?id=${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Erro ao apagar aula');
      void fetchCourseData();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const deleteModule = async (id: string) => {
    if (!confirm('Apagar este modulo e todas as suas aulas?')) return;

    try {
      const response = await fetch(`/api/admin/modules?id=${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Erro ao apagar modulo');
      void fetchCourseData();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const deleteCourse = async () => {
    if (!confirm('Tem certeza que deseja apagar este bloco inteiro?')) return;

    try {
      const response = await fetch(`/api/admin/courses?id=${courseId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Erro ao apagar trilha');
      router.push('/admin/cursos');
    } catch (error: any) {
      alert(error.message);
    }
  };

  if (loading) {
    return (
      <div className="p-20 text-center">
        <Loader2 className="mx-auto animate-spin text-primary-600" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <Link href="/admin/cursos" className="rounded-full border border-stone-200 bg-white p-2 text-stone-500">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-serif font-bold text-stone-900">{course?.title}</h1>
              <span className="rounded bg-stone-200 px-2 py-0.5 text-xs font-bold uppercase text-stone-600">{course?.level}</span>
            </div>
            <p className="mt-1 text-sm text-stone-500">Configure modulos, aulas, atividades e materiais deste bloco.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={deleteCourse} className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 font-bold text-red-600">
            <Trash2 size={16} /> Apagar Bloco
          </button>
          <button
            onClick={handleTogglePublish}
            className={`rounded-xl px-5 py-2 font-bold ${
              course?.is_published ? 'border border-amber-200 bg-amber-100 text-amber-800' : 'bg-green-600 text-white'
            }`}
          >
            {course?.is_published ? 'Despublicar' : 'Publicar Bloco'}
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <div className="flex border-b border-stone-200 bg-stone-50">
          <button onClick={() => setActiveTab('content')} className={`relative flex items-center gap-2 px-6 py-4 text-sm font-bold ${activeTab === 'content' ? 'text-primary-700' : 'text-stone-500'}`}>
            <Video size={18} /> Conteudo e Aulas
            {activeTab === 'content' ? <span className="absolute bottom-0 left-0 h-0.5 w-full bg-primary-600" /> : null}
          </button>
          <button onClick={() => setActiveTab('settings')} className={`relative flex items-center gap-2 px-6 py-4 text-sm font-bold ${activeTab === 'settings' ? 'text-primary-700' : 'text-stone-500'}`}>
            <Settings size={18} /> Configuracoes
            {activeTab === 'settings' ? <span className="absolute bottom-0 left-0 h-0.5 w-full bg-primary-600" /> : null}
          </button>
        </div>

        {activeTab === 'settings' ? (
          <form onSubmit={handleSaveSettings} className="space-y-6 p-6">
            <div>
              <label className="mb-1 block text-sm font-bold text-stone-700">Titulo do Bloco</label>
              <input value={courseForm.title} onChange={(event) => setCourseForm({ ...courseForm, title: event.target.value })} className="w-full rounded-xl border border-stone-200 px-4 py-2 outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-bold text-stone-700">Descricao</label>
              <textarea value={courseForm.description} onChange={(event) => setCourseForm({ ...courseForm, description: event.target.value })} className="h-24 w-full rounded-xl border border-stone-200 px-4 py-2 outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-bold text-stone-700">Nivel</label>
                <select value={courseForm.level} onChange={(event) => setCourseForm({ ...courseForm, level: event.target.value })} className="w-full rounded-xl border border-stone-200 bg-white px-4 py-2 outline-none focus:ring-2 focus:ring-primary-500">
                  <option>Iniciante</option>
                  <option>Intermediario</option>
                  <option>Avancado</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-bold text-stone-700">Nome da instrutora</label>
                <input value={courseForm.instructor_name} onChange={(event) => setCourseForm({ ...courseForm, instructor_name: event.target.value })} className="w-full rounded-xl border border-stone-200 px-4 py-2 outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <label className="block text-sm font-bold text-stone-700">Foto de capa</label>
                <div className="relative h-40 overflow-hidden rounded-2xl border border-stone-200 bg-stone-50">
                  {courseForm.thumbnail_url ? <img src={courseForm.thumbnail_url} alt="Preview da capa" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center gap-2 text-sm text-stone-400"><ImageIcon size={18} /> Nenhuma capa enviada</div>}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-bold text-white">
                    {isUploadingThumbnail ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                    {isUploadingThumbnail ? 'Enviando...' : 'Enviar capa'}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0] || null;
                        if (file) {
                          setPendingImage(file);
                          setCropperTarget('thumbnail');
                          setShowCropper(true);
                        }
                        event.currentTarget.value = '';
                      }}
                    />
                  </label>
                  {courseForm.thumbnail_url ? <button type="button" onClick={() => setCourseForm({ ...courseForm, thumbnail_url: '' })} className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-bold text-stone-600"><X size={16} /> Remover</button> : null}
                </div>
              </div>
              <div className="space-y-3">
                <label className="block text-sm font-bold text-stone-700">Foto da instrutora</label>
                <div className="relative h-40 overflow-hidden rounded-2xl border border-stone-200 bg-stone-50">
                  {courseForm.instructor_avatar_url ? <img src={courseForm.instructor_avatar_url} alt="Preview da instrutora" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center gap-2 text-sm text-stone-400"><ImageIcon size={18} /> Nenhuma foto enviada</div>}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-bold text-white">
                    {isUploadingInstructorAvatar ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                    {isUploadingInstructorAvatar ? 'Enviando...' : 'Enviar foto'}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0] || null;
                        if (file) {
                          setPendingImage(file);
                          setCropperTarget('instructor');
                          setShowCropper(true);
                        }
                        event.currentTarget.value = '';
                      }}
                    />
                  </label>
                  {courseForm.instructor_avatar_url ? <button type="button" onClick={() => setCourseForm({ ...courseForm, instructor_avatar_url: '' })} className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-bold text-stone-600"><X size={16} /> Remover</button> : null}
                </div>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-bold text-stone-700">Minibiografia</label>
              <textarea value={courseForm.instructor_description} onChange={(event) => setCourseForm({ ...courseForm, instructor_description: event.target.value })} className="h-20 w-full rounded-xl border border-stone-200 px-4 py-2 outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-bold text-stone-700">Beneficios (JSON)</label>
              <textarea value={courseForm.benefits} onChange={(event) => setCourseForm({ ...courseForm, benefits: event.target.value })} className="h-32 w-full rounded-xl border border-stone-200 px-4 py-2 font-mono text-xs outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={isSavingCourse} className="flex items-center gap-2 rounded-xl bg-primary-600 px-8 py-3 font-bold text-white disabled:opacity-50">
                {isSavingCourse ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                Salvar configuracoes
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6 p-6">
            <div className="flex items-end justify-between border-b border-stone-100 pb-4">
              <h2 className="text-xl font-bold text-stone-800">Modulos do bloco</h2>
              <button onClick={() => setShowModuleModal(true)} className="flex items-center gap-2 rounded-lg bg-primary-50 px-4 py-2 font-bold text-primary-600">
                <Plus size={18} /> Novo Modulo
              </button>
            </div>
            {modules.length === 0 ? (
              <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 py-12 text-center text-stone-500">Nenhum modulo cadastrado ainda.</div>
            ) : (
              modules.map((module, moduleIndex) => (
                <div key={module.id} className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
                  <div className="group flex items-center justify-between border-b border-stone-200 bg-stone-100/70 p-4">
                    <h3 className="flex items-center gap-3 text-lg font-bold text-stone-800">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 bg-white text-sm shadow-sm">{moduleIndex + 1}</span>
                      {module.title}
                    </h3>
                    <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <button onClick={() => deleteModule(module.id)} className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-bold text-red-500"><Trash2 size={14} /> Apagar</button>
                      <button onClick={() => openCreateLessonModal(module.id)} className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm font-bold text-stone-600"><Plus size={14} /> Adicionar Aula</button>
                    </div>
                  </div>
                  <div className="divide-y divide-stone-100">
                    {module.lessons.length === 0 ? (
                      <div className="p-4 pl-16 text-sm italic text-stone-400">Sem aulas cadastradas neste modulo.</div>
                    ) : (
                      module.lessons.map((lesson: any, lessonIndex: number) => (
                        <div key={lesson.id} className="group flex items-center justify-between p-4 pl-16 hover:bg-stone-50">
                          <div className="flex items-center gap-4">
                            <div className="rounded-lg bg-stone-100 p-2 text-stone-400">
                              {lesson.type === 'video' ? <Play size={16} className="fill-stone-400" /> : <FileText size={16} />}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-stone-800">{lessonIndex + 1}. {lesson.title}</div>
                              <div className="text-xs text-stone-500">
                                {lesson.duration_minutes > 0 ? `${lesson.duration_minutes} min • ` : ''}
                                {getLessonMaterials(lesson).length > 0
                                  ? `${getLessonMaterials(lesson).length} material(is) complementar(es)`
                                  : Array.isArray(lesson.activity_questions) && lesson.activity_questions.length > 0
                                    ? `${lesson.activity_questions.length} pergunta(s) de atividade`
                                    : lesson.content_url || 'Sem material anexado'}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            <button onClick={() => openEditLessonModal(module.id, lesson)} className="rounded p-2 text-stone-500 hover:bg-stone-100"><Settings size={16} /></button>
                            <button onClick={() => deleteLesson(lesson.id)} className="rounded p-2 text-red-500 hover:bg-red-50"><Trash2 size={16} /></button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {showModuleModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form onSubmit={handleCreateModule} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="mb-4 text-xl font-bold">Novo Modulo</h2>
            <input autoFocus required value={moduleTitle} onChange={(event) => setModuleTitle(event.target.value)} className="mb-6 w-full rounded-xl border border-stone-200 px-4 py-2 outline-none focus:ring-2 focus:ring-primary-500" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowModuleModal(false)} className="rounded-lg px-4 py-2 font-bold text-stone-500 hover:bg-stone-100">Cancelar</button>
              <button type="submit" disabled={isSavingModule} className="rounded-lg bg-stone-900 px-4 py-2 font-bold text-white disabled:opacity-50">{isSavingModule ? 'Salvando...' : 'Salvar'}</button>
            </div>
          </form>
        </div>
      ) : null}

      {showLessonModal ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 p-4">
          <form onSubmit={handleSaveLesson} className="mx-auto my-6 flex max-h-[calc(100vh-3rem)] w-full max-w-2xl flex-col rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="mb-6 text-xl font-bold">{editingLessonId ? 'Editar Aula' : 'Nova Aula'}</h2>
            <div className="space-y-4 overflow-y-auto pr-1">
              <div>
                <label className="mb-1 block text-sm font-bold text-stone-700">Titulo da Aula</label>
                <input value={lessonData.title} onChange={(event) => setLessonData({ ...lessonData, title: event.target.value })} className="w-full rounded-xl border border-stone-200 px-4 py-2 outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-bold text-stone-700">Descricao</label>
                <textarea value={lessonData.description} onChange={(event) => setLessonData({ ...lessonData, description: event.target.value })} className="h-20 w-full rounded-xl border border-stone-200 px-4 py-2 outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-bold text-stone-700">Tipo</label>
                  <select value={lessonData.type} onChange={(event) => setLessonData({ ...lessonData, type: event.target.value as 'video' | 'text', content_url: '', duration_minutes: 0 })} className="w-full rounded-xl border border-stone-200 bg-white px-4 py-2 outline-none focus:ring-2 focus:ring-primary-500">
                    <option value="video">Video</option>
                    <option value="text">Texto/Documento</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-bold text-stone-700">Duracao (minutos)</label>
                  <input type="number" min="0" value={lessonData.duration_minutes} onChange={(event) => setLessonData({ ...lessonData, duration_minutes: parseInt(event.target.value, 10) || 0 })} readOnly={isYouTubeLessonUrl || lessonData.is_coming_soon} disabled={lessonData.is_coming_soon} className="w-full rounded-xl border border-stone-200 px-4 py-2 outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-stone-100" />
                </div>
              </div>
              <label className="flex items-start gap-3 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3">
                <input
                  type="checkbox"
                  checked={lessonData.is_coming_soon}
                  onChange={(event) =>
                    setLessonData((current) => ({
                      ...current,
                      is_coming_soon: event.target.checked,
                      content_url: event.target.checked ? '' : current.content_url,
                      duration_minutes: event.target.checked ? 0 : current.duration_minutes,
                    }))
                  }
                  className="mt-1 h-4 w-4 rounded border-stone-300 text-primary-600 focus:ring-primary-500"
                />
                <div>
                  <div className="text-sm font-bold text-stone-700">Aula ainda nao gravada</div>
                  <p className="mt-1 text-xs text-stone-500">Marque para exibir essa aula em cinza, com cadeado e texto "Em breve" para as alunas.</p>
                </div>
              </label>
              {lessonData.is_coming_soon ? (
                <div className="space-y-3">
                  <label className="block text-sm font-bold text-stone-700">Imagem da aula em breve</label>
                  <div className="relative h-44 overflow-hidden rounded-2xl border border-stone-200 bg-stone-100">
                    {lessonData.coming_soon_image_url ? (
                      <>
                        <img
                          src={lessonData.coming_soon_image_url}
                          alt="Preview da aula em breve"
                          className="h-full w-full object-cover grayscale"
                        />
                        <div className="absolute inset-0 bg-stone-900/35" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15 backdrop-blur">
                            <Lock size={24} className="text-white" />
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex h-full items-center justify-center gap-2 text-sm text-stone-500">
                        <ImageIcon size={18} /> Nenhuma imagem enviada ainda
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-bold text-white">
                      {isUploadingComingSoonImage ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                      {isUploadingComingSoonImage ? 'Enviando...' : 'Enviar imagem'}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0] || null;
                          void handleComingSoonImageUpload(file);
                          event.currentTarget.value = '';
                        }}
                      />
                    </label>
                    {lessonData.coming_soon_image_url ? (
                      <button
                        type="button"
                        onClick={() => setLessonData((current) => ({ ...current, coming_soon_image_url: '' }))}
                        className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-bold text-stone-600"
                      >
                        <X size={16} /> Remover imagem
                      </button>
                    ) : null}
                  </div>
                </div>
              ) : null}
              <div>
                <label className="mb-1 block text-sm font-bold text-stone-700">{lessonData.type === 'video' ? 'URL do video no YouTube' : 'Arquivo principal da aula'}</label>
                {lessonData.is_coming_soon ? (
                  <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-4 text-sm text-stone-500">
                    Esta aula aparecera apenas como "Em breve" ate voce liberar o conteudo.
                  </div>
                ) : lessonData.type === 'video' ? (
                  <input value={lessonData.content_url} onChange={(event) => setLessonData({ ...lessonData, content_url: event.target.value })} type="url" className="w-full rounded-xl border border-stone-200 px-4 py-2 outline-none focus:ring-2 focus:ring-primary-500" placeholder="https://youtube.com/..." />
                ) : (
                  <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-4">
                    <div className="flex flex-col gap-3">
                      <div className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-600">
                        {lessonData.content_url ? <span className="inline-flex items-center gap-2 text-primary-700"><Paperclip size={16} /> Arquivo principal enviado</span> : 'Nenhum arquivo principal enviado ainda.'}
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-bold text-white">
                          {isUploadingLessonContent ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                          {isUploadingLessonContent ? 'Enviando...' : 'Enviar arquivo'}
                          <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.mp3,.wav,.mp4,.zip" className="hidden" onChange={(event) => { const file = event.target.files?.[0] || null; void handleLessonContentUpload(file); event.currentTarget.value = ''; }} />
                        </label>
                        {lessonData.content_url ? <button type="button" onClick={() => setLessonData({ ...lessonData, content_url: '' })} className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-bold text-stone-600"><X size={16} /> Remover</button> : null}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3">
                <p className="text-sm font-bold text-stone-700">Duracao da aula</p>
                <p className="mt-1 text-sm text-stone-600">
                  {lessonData.is_coming_soon ? 'Para as alunas, a duracao sera substituida por "Em breve".' : lessonData.type !== 'video' ? (lessonData.content_url ? 'Arquivo principal anexado a esta aula.' : 'Envie o arquivo principal desta aula nesta tela.') : lessonData.duration_minutes > 0 ? `${lessonData.duration_minutes} min detectados automaticamente` : 'Cole o link do YouTube para a plataforma detectar a duracao automaticamente.'}
                </p>
                {lessonDurationStatus ? <p className={`mt-2 text-xs font-medium ${lessonDurationStatus.includes('automaticamente') ? 'text-primary-700' : 'text-amber-700'}`}>{isDetectingLessonDuration ? 'Detectando duracao do video...' : lessonDurationStatus}</p> : null}
              </div>
              <div>
                <label className="mb-1 block text-sm font-bold text-stone-700">Materiais Complementares</label>
                <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-bold text-white">
                      {isUploadingLessonMaterial ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                      {isUploadingLessonMaterial ? 'Enviando...' : 'Adicionar material'}
                      <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.mp3,.wav,.mp4,.zip" className="hidden" onChange={(event) => { const file = event.target.files?.[0] || null; void handleLessonMaterialUpload(file); event.currentTarget.value = ''; }} />
                    </label>
                    <span className="text-xs text-stone-500">So o video do YouTube continua por URL. O resto entra por upload.</span>
                  </div>
                  {lessonData.materials.length > 0 ? (
                    <div className="mt-4 space-y-3">
                      {lessonData.materials.map((material, index) => (
                        <div key={material.clientId} className="rounded-xl border border-stone-200 bg-white p-3">
                          <div className="flex items-start gap-3">
                            <div className="mt-2 text-stone-400">{material.kind === 'pdf' ? <FileText size={16} /> : <Paperclip size={16} />}</div>
                            <div className="flex-1 space-y-2">
                              <input type="text" value={material.title} onChange={(event) => updateLessonMaterialTitle(material.clientId, event.target.value)} className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500" placeholder="Titulo do material" />
                              <div className="flex items-center gap-2 text-xs text-stone-500">
                                <LinkIcon size={12} />
                                <span className="truncate">{material.url}</span>
                              </div>
                            </div>
                            <button type="button" onClick={() => removeLessonMaterial(material.clientId)} className="rounded-lg p-2 text-red-500 hover:bg-red-50 hover:text-red-700"><Trash2 size={14} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : <p className="mt-3 text-xs text-stone-500">Nenhum material complementar anexado ainda.</p>}
                </div>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label className="block text-sm font-bold text-stone-700">Perguntas da atividade</label>
                  <button
                    type="button"
                    onClick={addLessonQuestion}
                    className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-bold text-stone-700"
                  >
                    <Plus size={14} />
                    Adicionar pergunta
                  </button>
                </div>
                <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-4">
                  {lessonData.activity_questions.length > 0 ? (
                    <div className="space-y-3">
                      {lessonData.activity_questions.map((question, index) => (
                        <div key={question.clientId} className="rounded-xl border border-stone-200 bg-white p-3">
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <span className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">
                              Pergunta {index + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeLessonQuestion(question.clientId)}
                              className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                          <textarea
                            value={question.prompt}
                            onChange={(event) => updateLessonQuestion(question.clientId, event.target.value)}
                            className="min-h-[96px] w-full rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="Escreva a pergunta que a aluna deve responder nesta aula..."
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-stone-500">
                      Se quiser transformar esta aula em atividade escrita, adicione uma ou mais perguntas aqui.
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-8 flex justify-end gap-3 border-t border-stone-100 pt-4">
              <button type="button" onClick={() => { setShowLessonModal(false); resetLessonModal(); }} className="rounded-xl px-5 py-2.5 font-bold text-stone-500 hover:bg-stone-100">Cancelar</button>
              <button type="submit" disabled={isSavingLesson || isDetectingLessonDuration} className="flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 font-bold text-white disabled:opacity-50">
                <Save size={18} />
                {isSavingLesson ? 'Salvando...' : isDetectingLessonDuration ? 'Lendo duracao...' : editingLessonId ? 'Salvar Alteracoes' : 'Salvar Aula'}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {showCropper && pendingImage && (
        <ImageCropper
          imageFile={pendingImage}
          aspectRatio={cropperTarget === 'thumbnail' ? 16 / 9 : 1}
          onCrop={(cropped) => {
            setShowCropper(false);
            setPendingImage(null);
            void uploadImageField(cropped, cropperTarget);
          }}
          onCancel={() => {
            setShowCropper(false);
            setPendingImage(null);
          }}
        />
      )}
    </div>
  );
}
