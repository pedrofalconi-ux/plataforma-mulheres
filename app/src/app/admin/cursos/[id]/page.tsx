'use client';

import React, { use, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FileText, Image as ImageIcon, Link as LinkIcon, Loader2, Paperclip, Play, Plus, Save, Settings, Trash2, Upload, Video, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import ImageCropper from '@/components/admin/ImageCropper';

const YOUTUBE_URL_PATTERN =
  /(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/;

type LessonMaterial = {
  title: string;
  url: string;
  kind: 'pdf' | 'link' | 'download';
};

type LessonDraft = {
  title: string;
  description: string;
  type: 'video' | 'text';
  content_url: string;
  duration_minutes: number;
  materials: LessonMaterial[];
};

const emptyLessonDraft = (): LessonDraft => ({
  title: '',
  description: '',
  type: 'video',
  content_url: '',
  duration_minutes: 0,
  materials: [],
});

function extractYouTubeVideoId(url: string) {
  const match = url.match(YOUTUBE_URL_PATTERN);
  return match?.[1] || null;
}

async function loadYouTubeIframeApi() {
  if (typeof window === 'undefined') {
    throw new Error('YouTube API indisponivel.');
  }

  if ((window as any).YT?.Player) {
    return (window as any).YT;
  }

  await new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector('script[data-youtube-iframe-api="true"]');

    if (!existingScript) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      script.dataset.youtubeIframeApi = 'true';
      script.onerror = () => reject(new Error('Nao foi possivel carregar a API do YouTube.'));
      document.head.appendChild(script);
    }

    const previousReady = (window as any).onYouTubeIframeAPIReady;
    (window as any).onYouTubeIframeAPIReady = () => {
      previousReady?.();
      resolve();
    };

    window.setTimeout(() => {
      if ((window as any).YT?.Player) {
        resolve();
      }
    }, 300);
  });

  return (window as any).YT;
}

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
  const [lessonData, setLessonData] = useState<LessonDraft>(emptyLessonDraft);

  const [isSavingCourse, setIsSavingCourse] = useState(false);
  const [isSavingModule, setIsSavingModule] = useState(false);
  const [isSavingLesson, setIsSavingLesson] = useState(false);
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
  const [isUploadingInstructorAvatar, setIsUploadingInstructorAvatar] = useState(false);
  const [isUploadingLessonContent, setIsUploadingLessonContent] = useState(false);
  const [isUploadingLessonMaterial, setIsUploadingLessonMaterial] = useState(false);
  const [isDetectingLessonDuration, setIsDetectingLessonDuration] = useState(false);
  const [lessonDurationStatus, setLessonDurationStatus] = useState('');

  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [cropperTarget, setCropperTarget] = useState<'thumbnail' | 'instructor'>('thumbnail');

  const youtubeDurationPlayerRef = useRef<any>(null);

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

  const updateLessonMaterialTitle = (index: number, title: string) => {
    setLessonData((current) => ({
      ...current,
      materials: current.materials.map((material, materialIndex) =>
        materialIndex === index ? { ...material, title } : material,
      ),
    }));
  };

  const removeLessonMaterial = (index: number) => {
    setLessonData((current) => ({
      ...current,
      materials: current.materials.filter((_, materialIndex) => materialIndex !== index),
    }));
  };

  const resetLessonModal = () => {
    setLessonData(emptyLessonDraft());
    setLessonDurationStatus('');
    youtubeDurationPlayerRef.current?.destroy?.();
    youtubeDurationPlayerRef.current = null;
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
      .select('id, title, order_index, lessons(id, title, type, content_url, duration_minutes, order_index, materials)')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });

    const { data: loadedModules } = modulesWithMaterials.error
      ? await supabase
          .from('modules')
          .select('id, title, order_index, lessons(id, title, type, content_url, duration_minutes, order_index)')
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
      return;
    }

    const videoId = extractYouTubeVideoId(trimmedUrl);
    if (!videoId) return;

    const timer = window.setTimeout(async () => {
      try {
        setIsDetectingLessonDuration(true);
        setLessonDurationStatus('Detectando duracao do video...');
        const YT = await loadYouTubeIframeApi();

        youtubeDurationPlayerRef.current?.destroy?.();

        await new Promise<void>((resolve, reject) => {
          const player = new YT.Player('youtube-duration-probe', {
            height: '0',
            width: '0',
            videoId,
            playerVars: { autoplay: 0, controls: 0, rel: 0 },
            events: {
              onReady: (event: any) => {
                let attempts = 0;

                const pollDuration = () => {
                  attempts += 1;
                  const durationSeconds = Number(event.target.getDuration?.() || 0);

                  if (durationSeconds > 0) {
                    const durationMinutes = Math.max(1, Math.ceil(durationSeconds / 60));
                    setLessonData((current) => ({ ...current, duration_minutes: durationMinutes }));
                    setLessonDurationStatus(`Duracao detectada automaticamente: ${durationMinutes} min`);
                    resolve();
                    return;
                  }

                  if (attempts >= 25) {
                    reject(new Error('O YouTube nao retornou a duracao deste video.'));
                    return;
                  }

                  window.setTimeout(pollDuration, 250);
                };

                pollDuration();
              },
              onError: () => reject(new Error('O YouTube nao permitiu ler este video automaticamente.')),
            },
          });

          youtubeDurationPlayerRef.current = player;
        });
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
      youtubeDurationPlayerRef.current?.destroy?.();
      youtubeDurationPlayerRef.current = null;
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

  const handleCreateLesson = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!lessonData.title || !activeModuleId || isSavingLesson) return;

    if (lessonData.type === 'video' && !lessonData.content_url.trim()) {
      alert('Informe a URL do video no YouTube.');
      return;
    }

    if (lessonData.type !== 'video' && !lessonData.content_url.trim()) {
      alert('Envie o arquivo principal da aula.');
      return;
    }

    setIsSavingLesson(true);

    try {
      const targetModule = modules.find((module) => module.id === activeModuleId);
      const newOrderIndex = targetModule ? targetModule.lessons.length : 0;

      const response = await fetch('/api/admin/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module_id: activeModuleId,
          title: lessonData.title,
          description: lessonData.description,
          type: lessonData.type,
          content_url: lessonData.content_url,
          materials: lessonData.materials,
          duration_minutes: lessonData.duration_minutes || 0,
          order_index: newOrderIndex,
        }),
      });

      const data = await parseResponse(response);
      if (!response.ok) throw new Error(data.error || 'Erro ao criar aula');

      void fetchCourseData();
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
            <p className="mt-1 text-sm text-stone-500">Configure modulos, aulas e materiais deste bloco.</p>
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
                      <button onClick={() => { setActiveModuleId(module.id); resetLessonModal(); setShowLessonModal(true); }} className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm font-bold text-stone-600"><Plus size={14} /> Adicionar Aula</button>
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
                                {getLessonMaterials(lesson).length > 0 ? `${getLessonMaterials(lesson).length} material(is) complementar(es)` : lesson.content_url || 'Sem material anexado'}
                              </div>
                            </div>
                          </div>
                          <div className="opacity-0 transition-opacity group-hover:opacity-100">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form onSubmit={handleCreateLesson} className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="mb-6 text-xl font-bold">Nova Aula</h2>
            <div className="space-y-4">
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
                  <input type="number" min="0" value={lessonData.duration_minutes} onChange={(event) => setLessonData({ ...lessonData, duration_minutes: parseInt(event.target.value, 10) || 0 })} readOnly={isYouTubeLessonUrl} className="w-full rounded-xl border border-stone-200 px-4 py-2 outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-bold text-stone-700">{lessonData.type === 'video' ? 'URL do video no YouTube' : 'Arquivo principal da aula'}</label>
                {lessonData.type === 'video' ? (
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
                  {lessonData.type !== 'video' ? (lessonData.content_url ? 'Arquivo principal anexado a esta aula.' : 'Envie o arquivo principal desta aula nesta tela.') : lessonData.duration_minutes > 0 ? `${lessonData.duration_minutes} min detectados automaticamente` : 'Cole o link do YouTube para a plataforma detectar a duracao automaticamente.'}
                </p>
                {lessonDurationStatus ? <p className={`mt-2 text-xs font-medium ${lessonDurationStatus.includes('automaticamente') ? 'text-primary-700' : 'text-amber-700'}`}>{isDetectingLessonDuration ? 'Detectando duracao do video...' : lessonDurationStatus}</p> : null}
                <div id="youtube-duration-probe" className="hidden" />
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
                        <div key={`${material.url}-${index}`} className="rounded-xl border border-stone-200 bg-white p-3">
                          <div className="flex items-start gap-3">
                            <div className="mt-2 text-stone-400">{material.kind === 'pdf' ? <FileText size={16} /> : <Paperclip size={16} />}</div>
                            <div className="flex-1 space-y-2">
                              <input type="text" value={material.title} onChange={(event) => updateLessonMaterialTitle(index, event.target.value)} className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500" placeholder="Titulo do material" />
                              <div className="flex items-center gap-2 text-xs text-stone-500">
                                <LinkIcon size={12} />
                                <span className="truncate">{material.url}</span>
                              </div>
                            </div>
                            <button type="button" onClick={() => removeLessonMaterial(index)} className="rounded-lg p-2 text-red-500 hover:bg-red-50 hover:text-red-700"><Trash2 size={14} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : <p className="mt-3 text-xs text-stone-500">Nenhum material complementar anexado ainda.</p>}
                </div>
              </div>
            </div>
            <div className="mt-8 flex justify-end gap-3 border-t border-stone-100 pt-4">
              <button type="button" onClick={() => { setShowLessonModal(false); resetLessonModal(); }} className="rounded-xl px-5 py-2.5 font-bold text-stone-500 hover:bg-stone-100">Cancelar</button>
              <button type="submit" disabled={isSavingLesson || isDetectingLessonDuration} className="flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 font-bold text-white disabled:opacity-50">
                <Save size={18} />
                {isSavingLesson ? 'Salvando...' : isDetectingLessonDuration ? 'Lendo duracao...' : 'Salvar Aula'}
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
