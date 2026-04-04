'use client';

import React, { useState, useEffect, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Plus, Play, FileText, Trash2, Loader2, Save, Settings, Video, Upload, Image as ImageIcon, X } from 'lucide-react';
import Link from 'next/link';

const YOUTUBE_URL_PATTERN = /(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/;

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

  // Form states for settings
  const [courseForm, setCourseForm] = useState({
    title: '', description: '', level: 'Iniciante', price: '0.00', thumbnail_url: '',
    instructor_name: '', instructor_description: '', instructor_avatar_url: '', benefits: ''
  });
  const [isSavingCourse, setIsSavingCourse] = useState(false);
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
  const [isUploadingInstructorAvatar, setIsUploadingInstructorAvatar] = useState(false);

  // Modals state
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [moduleTitle, setModuleTitle] = useState('');

  const [showLessonModal, setShowLessonModal] = useState(false);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [lessonData, setLessonData] = useState({
    title: '',
    description: '',
    type: 'video',
    content_url: '',
    duration_minutes: 0,
    materials: '[\n  {\n    "title": "PDF da aula",\n    "url": "https://exemplo.com/material.pdf",\n    "kind": "pdf"\n  }\n]'
  });
  const [isSavingModule, setIsSavingModule] = useState(false);
  const [isSavingLesson, setIsSavingLesson] = useState(false);
  const [isDetectingLessonDuration, setIsDetectingLessonDuration] = useState(false);
  const [lessonDurationStatus, setLessonDurationStatus] = useState('');
  const youtubeDurationPlayerRef = useRef<any>(null);

  const getLessonMaterials = (lesson: any) => Array.isArray(lesson?.materials) ? lesson.materials : [];
  const isYouTubeLessonUrl = lessonData.type === 'video' && YOUTUBE_URL_PATTERN.test(lessonData.content_url);

  const uploadCourseImage = async (file: File, assetType: 'thumbnail' | 'instructor-avatar') => {
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
      throw new Error(data.error || 'Falha ao enviar imagem.');
    }

    return data.url as string;
  };

  const handleImageUpload = async (file: File | null, target: 'thumbnail' | 'instructor') => {
    if (!file) return;

    const setLoading = target === 'thumbnail' ? setIsUploadingThumbnail : setIsUploadingInstructorAvatar;
    const field = target === 'thumbnail' ? 'thumbnail_url' : 'instructor_avatar_url';

    try {
      setLoading(true);
      const uploadedUrl = await uploadCourseImage(
        file,
        target === 'thumbnail' ? 'thumbnail' : 'instructor-avatar'
      );

      setCourseForm((current) => ({
        ...current,
        [field]: uploadedUrl,
      }));
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : 'Falha ao enviar imagem.');
    } finally {
      setLoading(false);
    }
  };

  const parseResponse = async (response: Response) => {
    const rawText = await response.text();

    try {
      return rawText ? JSON.parse(rawText) : {};
    } catch {
      if (rawText.startsWith('<!DOCTYPE') || rawText.startsWith('<html')) {
        return { error: 'A API retornou HTML em vez de JSON. A função do servidor falhou ao processar a requisição.' };
      }

      return { error: rawText || 'Resposta inválida da API.' };
    }
  };

  useEffect(() => {
    void fetchCourseData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  useEffect(() => {
    if (!showLessonModal) return;

    const trimmedUrl = lessonData.content_url.trim();
    if (lessonData.type !== 'video' || !trimmedUrl || !YOUTUBE_URL_PATTERN.test(trimmedUrl)) {
      setIsDetectingLessonDuration(false);
      setLessonDurationStatus('');
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
            playerVars: {
              autoplay: 0,
              controls: 0,
              rel: 0,
            },
            events: {
              onReady: (event: any) => {
                let attempts = 0;

                const pollDuration = () => {
                  attempts += 1;
                  const durationSeconds = Number(event.target.getDuration?.() || 0);

                  if (durationSeconds > 0) {
                    const durationMinutes = Math.max(1, Math.ceil(durationSeconds / 60));
                    setLessonData((current) => ({
                      ...current,
                      duration_minutes: durationMinutes,
                    }));
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
        console.error(error);
        setLessonDurationStatus(
          error instanceof Error ? error.message : 'Nao foi possivel detectar a duracao automaticamente.'
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

  const fetchCourseData = async () => {
    const { data: c } = await supabase.from('courses').select('*').eq('id', courseId).single();
    if (c) {
      setCourse(c);
      
      let parsedBenefits = c.benefits || '[\n  "Fundamentos teóricos e práticos aplicados.",\n  "Acesso a metodologias exclusivas do Ecossistema.",\n  "Avaliações progressivas de conhecimento.",\n  "Certificado de conclusão reconhecido."\n]';
      if (typeof parsedBenefits !== 'string') {
        parsedBenefits = JSON.stringify(parsedBenefits, null, 2);
      }

      setCourseForm({
        title: c.title || '',
        description: c.description || '',
        level: c.level || 'Iniciante',
        price: c.price?.toString() || '0.00',
        thumbnail_url: c.thumbnail_url || '',
        instructor_name: c.instructor_name || '',
        instructor_description: c.instructor_description || '',
        instructor_avatar_url: c.instructor_avatar_url || '',
        benefits: parsedBenefits
      });
    }

    const modulesWithMaterials = await supabase
      .from('modules')
      .select(`id, title, order_index, lessons(id, title, type, content_url, duration_minutes, order_index, materials)`)
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });

    const { data: m } = modulesWithMaterials.error
      ? await supabase
          .from('modules')
          .select(`id, title, order_index, lessons(id, title, type, content_url, duration_minutes, order_index)`)
          .eq('course_id', courseId)
          .order('order_index', { ascending: true })
      : modulesWithMaterials;
    
    if (m) {
      const ordered = m.map((mod: any) => ({
        ...mod,
        lessons: mod.lessons.sort((a: any, b: any) => a.order_index - b.order_index)
      }));
      setModules(ordered);
    }
    setLoading(false);
  };

  const handleTogglePublish = async () => {
    const newVal = !course.is_published;
    try {
      const response = await fetch('/api/admin/courses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: courseId, is_published: newVal }),
      });
      const data = await parseResponse(response);
      if (!response.ok) throw new Error(data.error || 'Erro ao atualizar status');
      setCourse({ ...course, is_published: newVal });
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : 'Erro ao mudar status do curso.');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingCourse(true);
    let finalBenefits;
    try {
      finalBenefits = JSON.parse(courseForm.benefits || '[]');
    } catch (err) {
      alert("O campo de benefícios deve ser um JSON (array) válido. Verifique a formatação.");
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
          price: parseFloat(courseForm.price as string) || 0,
          thumbnail_url: courseForm.thumbnail_url,
          instructor_name: courseForm.instructor_name,
          instructor_description: courseForm.instructor_description,
          instructor_avatar_url: courseForm.instructor_avatar_url,
          benefits: finalBenefits
        }),
      });
      const data = await parseResponse(response);
      if (!response.ok) throw new Error(data.error || 'Erro ao salvar as configurações.');
      alert('Configurações do curso foram salvas com sucesso!');
      fetchCourseData();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsSavingCourse(false);
    }
  };

  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moduleTitle.trim() || isSavingModule) return;
    setIsSavingModule(true);
    try {
      const response = await fetch('/api/admin/modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_id: courseId, title: moduleTitle, order_index: modules.length }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erro ao criar módulo');
      
      setModules([...modules, { ...data, lessons: [] }]);
      setShowModuleModal(false);
      setModuleTitle('');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsSavingModule(false);
    }
  };

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonData.title || !activeModuleId || isSavingLesson) return;
    setIsSavingLesson(true);
    
    const targetModule = modules.find(m => m.id === activeModuleId);
    const newOrderIndex = targetModule ? targetModule.lessons.length : 0;
    let parsedMaterials: Array<{ title: string; url: string; kind: 'pdf' | 'link' | 'download' }> = [];

    try {
      parsedMaterials = JSON.parse(lessonData.materials || '[]');
      if (!Array.isArray(parsedMaterials)) {
        throw new Error('invalid materials');
      }
    } catch {
      alert('O campo de materiais complementares precisa estar em JSON valido.');
      setIsSavingLesson(false);
      return;
    }

    try {
      const response = await fetch('/api/admin/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module_id: activeModuleId,
          title: lessonData.title,
          description: lessonData.description,
          type: lessonData.type,
          content_url: lessonData.content_url,
          materials: parsedMaterials,
          duration_minutes: lessonData.duration_minutes || 0,
          order_index: newOrderIndex
        }),
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erro ao criar aula');

      fetchCourseData();
      setShowLessonModal(false);
      setLessonData({
        title: '',
        description: '',
        type: 'video',
        content_url: '',
        duration_minutes: 0,
        materials: '[\n  {\n    "title": "PDF da aula",\n    "url": "https://exemplo.com/material.pdf",\n    "kind": "pdf"\n  }\n]'
      });
      setLessonDurationStatus('');
      youtubeDurationPlayerRef.current?.destroy?.();
      youtubeDurationPlayerRef.current = null;
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsSavingLesson(false);
    }
  };

  const deleteLesson = async (id: string) => {
    if(confirm('Apagar esta aula?')) {
      try {
        const response = await fetch(`/api/admin/lessons?id=${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Erro ao apagar aula');
        fetchCourseData();
      } catch (error: any) { alert(error.message); }
    }
  };

  const deleteModule = async (id: string) => {
    if(confirm('Apagar este módulo e todas as suas aulas?')) {
      try {
        const response = await fetch(`/api/admin/modules?id=${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Erro ao apagar módulo');
        fetchCourseData();
      } catch (error: any) { alert(error.message); }
    }
  };

  const deleteCourse = async () => {
    if(confirm('Tem certeza que deseja apagar esta trilha inteira? Todos os módulos e aulas serão removidos.')) {
      try {
        const response = await fetch(`/api/admin/courses?id=${courseId}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Erro ao apagar trilha');
        router.push('/admin/cursos');
      } catch (error: any) { alert(error.message); }
    }
  };

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-primary-600" size={32} /></div>;

  return (
    <div>
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/cursos" className="p-2 rounded-full hover:bg-white text-stone-500 hover:text-stone-900 transition bg-white shadow-sm border border-stone-200">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-serif font-bold text-stone-900">{course?.title}</h1>
              <span className="bg-stone-200 text-stone-600 px-2 py-0.5 rounded text-xs font-bold uppercase">{course?.level}</span>
            </div>
            <p className="text-stone-500 text-sm mt-1">Configure as seções e os vídeos desta trilha.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={deleteCourse}
            className="px-4 py-2 rounded-xl font-bold flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 transition"
          >
            <Trash2 size={16} /> Apagar Trilha
          </button>
          <button 
            onClick={handleTogglePublish}
            className={`px-5 py-2 rounded-xl font-bold flex items-center gap-2 transition ${course?.is_published ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-green-600 text-white hover:bg-green-700'}`}
          >
            {course?.is_published ? 'Despublicar (Rascunho)' : 'Publicar Curso'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden mb-8">
        <div className="flex border-b border-stone-200 bg-stone-50 overflow-x-auto">
          <button 
            onClick={() => setActiveTab('content')}
            className={`flex items-center gap-2 px-6 py-4 font-bold text-sm transition-colors relative whitespace-nowrap ${activeTab === 'content' ? 'text-primary-700' : 'text-stone-500 hover:text-stone-700'}`}
          >
            <Video size={18} /> Conteúdo e Aulas
            {activeTab === 'content' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-600"></span>}
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-6 py-4 font-bold text-sm transition-colors relative whitespace-nowrap ${activeTab === 'settings' ? 'text-primary-700' : 'text-stone-500 hover:text-stone-700'}`}
          >
            <Settings size={18} /> Configurações e Instrutor
            {activeTab === 'settings' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-600"></span>}
          </button>
        </div>

        {activeTab === 'settings' && (
          <form onSubmit={handleSaveSettings} className="p-6 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h2 className="text-xl font-bold text-stone-800 border-b border-stone-100 pb-4">Informações Básicas</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-stone-700 mb-1">Título da Trilha</label>
                <input required value={courseForm.title} onChange={e => setCourseForm({...courseForm, title: e.target.value})} type="text" className="w-full border border-stone-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary-500 outline-none" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-stone-700 mb-1">Descrição Comercial</label>
                <textarea required value={courseForm.description} onChange={e => setCourseForm({...courseForm, description: e.target.value})} className="w-full border border-stone-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary-500 outline-none resize-none h-24" />
              </div>
              <div className="grid gap-4">
                <div className="hidden">
                  <label className="block text-sm font-bold text-stone-700 mb-1">Nível de Dificuldade</label>
                  <select required value={courseForm.level} onChange={e => setCourseForm({...courseForm, level: e.target.value})} className="w-full border border-stone-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary-500 outline-none bg-white">
                    <option>Iniciante</option>
                    <option>Intermediário</option>
                    <option>Avançado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1">Preço (R$)</label>
                  <input required min="0" step="0.01" value={courseForm.price} onChange={e => setCourseForm({...courseForm, price: e.target.value})} type="number" className="w-full border border-stone-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary-500 outline-none bg-white" placeholder="0.00" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Foto de Capa</label>
                <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-4">
                  <div className="flex flex-col gap-4">
                    <div className="relative h-40 overflow-hidden rounded-2xl border border-stone-200 bg-white">
                      {courseForm.thumbnail_url ? (
                        <img src={courseForm.thumbnail_url} alt="Preview da capa do curso" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center gap-2 text-sm text-stone-400">
                          <ImageIcon size={18} />
                          Nenhuma capa enviada
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-primary-700">
                        {isUploadingThumbnail ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                        {isUploadingThumbnail ? 'Enviando...' : 'Enviar capa'}
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/gif"
                          className="hidden"
                          onChange={(event) => {
                            const file = event.target.files?.[0] || null;
                            void handleImageUpload(file, 'thumbnail');
                            event.currentTarget.value = '';
                          }}
                        />
                      </label>

                      {courseForm.thumbnail_url ? (
                        <button
                          type="button"
                          onClick={() => setCourseForm({ ...courseForm, thumbnail_url: '' })}
                          className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-bold text-stone-600 transition hover:bg-stone-100"
                        >
                          <X size={16} />
                          Remover
                        </button>
                      ) : null}
                    </div>

                    <p className="text-xs text-stone-500">
                      Envie a imagem diretamente aqui. Formatos aceitos: JPG, PNG, WEBP ou GIF, com atÃ© 5MB.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <h2 className="text-xl font-bold text-stone-800 border-b border-stone-100 pb-4 pt-4">Área do Instrutor / Professor</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">Nome do Instrutor(a)</label>
                <input value={courseForm.instructor_name} onChange={e => setCourseForm({...courseForm, instructor_name: e.target.value})} type="text" className="w-full border border-stone-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Ex: Prof. Luiz" />
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Foto do Instrutor</label>
                <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="relative h-24 w-24 overflow-hidden rounded-2xl border border-stone-200 bg-white">
                      {courseForm.instructor_avatar_url ? (
                        <img src={courseForm.instructor_avatar_url} alt="Preview do instrutor" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-stone-400">
                          <ImageIcon size={18} />
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-primary-700">
                          {isUploadingInstructorAvatar ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                          {isUploadingInstructorAvatar ? 'Enviando...' : 'Enviar foto'}
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/gif"
                            className="hidden"
                            onChange={(event) => {
                              const file = event.target.files?.[0] || null;
                              void handleImageUpload(file, 'instructor');
                              event.currentTarget.value = '';
                            }}
                          />
                        </label>

                        {courseForm.instructor_avatar_url ? (
                          <button
                            type="button"
                            onClick={() => setCourseForm({ ...courseForm, instructor_avatar_url: '' })}
                            className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-bold text-stone-600 transition hover:bg-stone-100"
                          >
                            <X size={16} />
                            Remover
                          </button>
                        ) : null}
                      </div>

                      <p className="mt-3 text-xs text-stone-500">
                        A foto do instrutor tambÃ©m passa a ser enviada por upload nesta tela.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-stone-700 mb-1">Minibiografia</label>
                <textarea value={courseForm.instructor_description} onChange={e => setCourseForm({...courseForm, instructor_description: e.target.value})} className="w-full border border-stone-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary-500 outline-none resize-none h-16" placeholder="Titulação e experiências curtas..." />
              </div>
            </div>

            <h2 className="text-xl font-bold text-stone-800 border-b border-stone-100 pb-4 pt-4">Benefícios do Curso (O que você vai aprender)</h2>
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-2">Formato JSON (Array de textos)</label>
              <textarea 
                required 
                value={courseForm.benefits} 
                onChange={e => setCourseForm({...courseForm, benefits: e.target.value})} 
                className="w-full border border-stone-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary-500 outline-none font-mono text-xs h-32" 
                placeholder='["Aprender X", "Prática de Y"]' 
              />
              <p className="text-stone-500 text-xs mt-1 font-bold bg-amber-50 p-2 rounded">IMPORTANTE: Mantenha as aspas duplas, vírgulas separando os itens, e os colchetes [] nas extremidades. Este é o código que aparecerá com os botões verdes na tela de vendas.</p>
            </div>

            <div className="pt-6 flex justify-end">
               <button type="submit" disabled={isSavingCourse} className="bg-primary-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-primary-700 transition disabled:opacity-50">
                 {isSavingCourse ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} 
                 Salvar Todas as Configurações
               </button>
            </div>
          </form>
        )}

        {activeTab === 'content' && (
          <div className="p-6 md:p-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex justify-between items-end mb-8 border-b border-stone-100 pb-4">
              <h2 className="text-xl font-bold text-stone-800">Módulos da Trilha</h2>
              <button onClick={() => setShowModuleModal(true)} className="flex items-center gap-2 text-primary-600 font-bold hover:text-primary-800 bg-primary-50 px-4 py-2 rounded-lg">
                <Plus size={18} /> Novo Módulo
              </button>
            </div>

            <div className="space-y-6">
              {modules.length === 0 ? (
                <div className="text-center py-12 bg-stone-50 rounded-xl border border-dashed border-stone-300">
                  <p className="text-stone-500 font-medium">Nenhum módulo cadastrado ainda.</p>
                  <button onClick={() => setShowModuleModal(true)} className="mt-3 text-primary-600 font-bold hover:underline">Criar o primeiro módulo</button>
                </div>
              ) : (
                modules.map((module, i) => (
                  <div key={module.id} className="border border-stone-200 rounded-xl overflow-hidden bg-white shadow-sm">
                    
                    <div className="bg-stone-100/70 p-4 border-b border-stone-200 flex justify-between items-center group">
                      <h3 className="font-bold text-stone-800 text-lg flex items-center gap-3">
                        <span className="bg-white w-8 h-8 rounded-lg flex items-center justify-center text-sm border border-stone-200 shadow-sm">{i + 1}</span>
                        {module.title}
                      </h3>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => deleteModule(module.id)} className="text-sm font-bold text-red-500 hover:text-red-700 bg-white px-3 py-1.5 rounded-lg border border-red-200 shadow-sm flex items-center gap-1.5">
                          <Trash2 size={14} /> Apagar
                        </button>
                        <button onClick={() => { setActiveModuleId(module.id); setShowLessonModal(true); }} className="text-sm font-bold text-stone-600 hover:text-primary-600 bg-white px-3 py-1.5 rounded-lg border border-stone-200 shadow-sm flex items-center gap-1.5">
                          <Plus size={14} /> Adicionar Aula
                        </button>
                      </div>
                    </div>

                    <div className="divide-y divide-stone-100">
                      {module.lessons.length === 0 ? (
                        <div className="p-4 pl-16 text-stone-400 text-sm italic">Sem aulas cadastradas neste módulo.</div>
                      ) : (
                        module.lessons.map((lesson: any, li: number) => (
                          <div key={lesson.id} className="p-4 pl-16 flex items-center justify-between hover:bg-stone-50 group">
                            <div className="flex items-center gap-4">
                              <div className="text-stone-400 bg-stone-100 p-2 rounded-lg">
                                {lesson.type === 'video' ? <Play size={16} className="fill-stone-400" /> : <FileText size={16} />}
                              </div>
                              <div>
                                <div className="font-bold text-stone-800 text-sm">{li + 1}. {lesson.title}</div>
                                <div className="text-xs text-stone-500">
                                  {lesson.duration_minutes > 0 ? `${lesson.duration_minutes} min • ` : ''} 
                                  <span className="truncate max-w-[300px] inline-block align-bottom">
                                    {getLessonMaterials(lesson).length > 0
                                      ? `${getLessonMaterials(lesson).length} material(is) complementar(es)`
                                      : lesson.content_url || 'Sem material anexado'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => deleteLesson(lesson.id)} className="text-red-500 p-2 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Module Modal */}
      {showModuleModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 text-left">
          <form onSubmit={handleCreateModule} className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <h2 className="font-bold text-xl mb-4">Novo Módulo</h2>
            <input autoFocus required value={moduleTitle} onChange={e => setModuleTitle(e.target.value)} type="text" className="w-full border border-stone-200 rounded-xl px-4 py-2 mb-6 focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Ex: Fundamentos Básicos" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowModuleModal(false)} className="px-4 py-2 text-stone-500 font-bold hover:bg-stone-100 rounded-lg">Cancelar</button>
              <button type="submit" disabled={isSavingModule} className="px-4 py-2 bg-stone-900 text-white font-bold rounded-lg hover:bg-stone-800 disabled:opacity-50">{isSavingModule ? 'Salvando...' : 'Salvar'}</button>
            </div>
          </form>
        </div>
      )}

      {/* Lesson Modal */}
      {showLessonModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 text-left">
          <form onSubmit={handleCreateLesson} className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <h2 className="font-bold text-xl mb-6">Nova Aula</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">Título da Aula</label>
                <input required value={lessonData.title} onChange={e => setLessonData({...lessonData, title: e.target.value})} type="text" className="w-full border border-stone-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Ex: Introdução à Ética" />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">Descrição</label>
                <textarea required value={lessonData.description} onChange={e => setLessonData({...lessonData, description: e.target.value})} className="w-full border border-stone-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary-500 outline-none resize-none h-20" placeholder="Resumo do conteúdo..." />
              </div>

              <div className="grid grid-cols-2 gap-4 [&>div:nth-child(2)]:hidden">
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1">Tipo</label>
                  <select value={lessonData.type} onChange={e => setLessonData({...lessonData, type: e.target.value})} className="w-full border border-stone-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary-500 outline-none bg-white">
                    <option value="video">Vídeo</option>
                    <option value="text">Texto/Documento</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1">Duração (minutos)</label>
                  <input
                    type="number"
                    value={lessonData.duration_minutes}
                    onChange={e => setLessonData({...lessonData, duration_minutes: parseInt(e.target.value) || 0})}
                    className="w-full border border-stone-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary-500 outline-none"
                    min="0"
                    readOnly={isYouTubeLessonUrl}
                  />
                  <p className="mt-1 text-xs text-stone-500">
                    {isYouTubeLessonUrl
                      ? 'Para links do YouTube, a duracao e preenchida automaticamente.'
                      : 'Para outros formatos, voce ainda pode informar manualmente.'}
                  </p>
                  {lessonDurationStatus ? (
                    <p className={`mt-2 text-xs font-medium ${lessonDurationStatus.includes('automaticamente') ? 'text-primary-700' : 'text-amber-700'}`}>
                      {isDetectingLessonDuration ? 'Detectando duracao do video...' : lessonDurationStatus}
                    </p>
                  ) : null}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">Link do Conteúdo</label>
                <input required value={lessonData.content_url} onChange={e => setLessonData({...lessonData, content_url: e.target.value})} type="url" className="w-full border border-stone-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary-500 outline-none" placeholder="URL do YouTube ou PDF (ex: https://youtube.com/...)" />
              </div>

              <div className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3">
                <p className="text-sm font-bold text-stone-700">Duracao da aula</p>
                <p className="mt-1 text-sm text-stone-600">
                  {lessonData.type !== 'video'
                    ? 'Nao se aplica para aulas de texto/documento.'
                    : lessonData.duration_minutes > 0
                      ? `${lessonData.duration_minutes} min detectados automaticamente`
                      : 'Cole o link do YouTube para a plataforma detectar a duracao automaticamente.'}
                </p>
                {lessonDurationStatus ? (
                  <p className={`mt-2 text-xs font-medium ${lessonDurationStatus.includes('automaticamente') ? 'text-primary-700' : 'text-amber-700'}`}>
                    {isDetectingLessonDuration ? 'Detectando duracao do video...' : lessonDurationStatus}
                  </p>
                ) : null}
                <div id="youtube-duration-probe" className="hidden" />
              </div>

              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">Materiais Complementares</label>
                <textarea
                  value={lessonData.materials}
                  onChange={e => setLessonData({ ...lessonData, materials: e.target.value })}
                  className="w-full border border-stone-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary-500 outline-none font-mono text-xs h-36"
                  placeholder='[{"title":"PDF da aula","url":"https://...","kind":"pdf"}]'
                />
                <p className="mt-2 rounded-lg bg-stone-50 px-3 py-2 text-xs text-stone-500">
                  Informe uma lista JSON com <span className="font-mono">title</span>, <span className="font-mono">url</span> e <span className="font-mono">kind</span> (`pdf`, `link` ou `download`).
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-stone-100">
              <button type="button" onClick={() => setShowLessonModal(false)} className="px-5 py-2.5 text-stone-500 font-bold hover:bg-stone-100 rounded-xl transition">Cancelar</button>
              <button type="submit" disabled={isSavingLesson || isDetectingLessonDuration} className="px-5 py-2.5 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition flex items-center gap-2 disabled:opacity-50"><Save size={18}/> {isSavingLesson ? 'Salvando...' : isDetectingLessonDuration ? 'Lendo duracao...' : 'Salvar Aula'}</button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
