'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookOpen, Edit3, Image as ImageIcon, Loader2, Plus, Search, Trash2, Upload, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import ImageCropper from '@/components/admin/ImageCropper';

export default function AdminCursosPage() {
  const supabase = createClient();
  const router = useRouter();

  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState('Iniciante');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [showCropper, setShowCropper] = useState(false);

  const fetchCourses = async () => {
    const { data } = await supabase
      .from('courses')
      .select('id, title, level, is_published, thumbnail_url, created_at')
      .order('created_at', { ascending: false });

    setCourses(data || []);
    setLoading(false);
  };

  useEffect(() => {
    void fetchCourses();
  }, []);

  const parseResponse = async (response: Response) => {
    const rawText = await response.text();

    try {
      return rawText ? JSON.parse(rawText) : {};
    } catch {
      return { error: rawText || 'Resposta invalida da API.' };
    }
  };

  const handleThumbnailUpload = async (file: File | null) => {
    if (!file) return;

    try {
      setIsUploadingThumbnail(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('courseId', 'draft');
      formData.append('assetType', 'thumbnail');

      const response = await fetch('/api/admin/uploads', {
        method: 'POST',
        body: formData,
      });

      const data = await parseResponse(response);
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao enviar a capa.');
      }

      setThumbnailUrl(data.url || '');
    } catch (error: any) {
      alert(error.message || 'Erro ao enviar a capa.');
    } finally {
      setIsUploadingThumbnail(false);
    }
  };

  const handleCreateCourse = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;

    setIsCreating(true);

    try {
      const response = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          level,
          thumbnail_url: thumbnailUrl || null,
        }),
      });

      const data = await parseResponse(response);

      if (!response.ok) {
        const errorMsg = data.error || 'Erro ao criar trilha';
        if (data.details && data.details.fieldErrors) {
          const fieldErrors = Object.entries(data.details.fieldErrors)
            .map(([field, errors]) => `${field}: ${(errors as string[]).join(', ')}`)
            .join('\n');
          throw new Error(`${errorMsg}:\n${fieldErrors}`);
        }
        throw new Error(errorMsg);
      }

      router.push(`/admin/cursos/${data.id}`);
    } catch (error: any) {
      alert(error.message || 'Erro ao criar trilha.');
    } finally {
      setIsCreating(false);
    }
  };

  const deleteCourse = async (id: string) => {
    if (!confirm('Tem certeza que deseja apagar esta trilha?')) return;

    try {
      const response = await fetch(`/api/admin/courses?id=${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Erro ao apagar trilha');
      setCourses((current) => current.filter((course) => course.id !== id));
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-serif font-bold text-stone-900 sm:text-3xl">Gestao de Blocos</h1>
          <p className="text-stone-500">Organize os blocos da area de aprendizado, como Aprendizado e Testemunhos.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-3 font-bold text-white transition hover:bg-primary-700 sm:w-auto"
        >
          <Plus size={20} /> Novo Bloco
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <div className="border-b border-stone-200 bg-stone-50/50 p-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
            <input
              type="text"
              placeholder="Buscar trilhas..."
              className="w-full rounded-lg border border-stone-200 py-2 pl-10 pr-4 outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center p-12 text-stone-400">
            <Loader2 className="animate-spin" size={32} />
          </div>
        ) : courses.length === 0 ? (
          <div className="flex flex-col items-center p-10 text-center sm:p-16">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-stone-100 text-stone-400">
              <BookOpen size={32} />
            </div>
            <h3 className="mb-1 text-lg font-bold text-stone-800">Nenhum bloco encontrado</h3>
            <p className="mb-6 max-w-sm text-stone-500">
              Crie primeiro os blocos principais, como Aprendizado e Testemunhos, ou adicione um novo bloco extra.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left">
                <thead className="border-b border-stone-200 bg-stone-50 text-xs font-bold uppercase text-stone-500">
                  <tr>
                    <th className="px-6 py-4">Bloco</th>
                    <th className="px-6 py-4">Nivel</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Acoes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {courses.map((course) => (
                    <tr key={course.id} className="transition-colors hover:bg-stone-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-20 flex-shrink-0 overflow-hidden rounded-lg border border-stone-200 bg-stone-100">
                            {course.thumbnail_url ? (
                              <img src={course.thumbnail_url} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-stone-400">
                                <BookOpen size={16} />
                              </div>
                            )}
                          </div>
                          <span className="font-bold text-stone-800">{course.title}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-stone-600">
                        <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-bold text-stone-600">
                          {course.level}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={course.is_published ? 'text-sm font-bold text-green-600' : 'text-sm font-bold text-amber-500'}>
                          {course.is_published ? 'Publicado' : 'Rascunho'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <Link
                            href={`/admin/cursos/${course.id}`}
                            className="flex items-center gap-1 font-bold text-primary-600 hover:text-primary-800"
                          >
                            <Edit3 size={16} /> Editar
                          </Link>
                          <button
                            onClick={() => deleteCourse(course.id)}
                            className="rounded-lg p-1.5 text-red-500 transition hover:bg-red-50 hover:text-red-700"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-4 p-4 md:hidden">
              {courses.map((course) => (
                <article key={course.id} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-14 w-20 flex-shrink-0 overflow-hidden rounded-xl border border-stone-200 bg-white">
                      {course.thumbnail_url ? (
                        <img src={course.thumbnail_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-stone-400">
                          <BookOpen size={16} />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="line-clamp-2 font-bold text-stone-900">{course.title}</h3>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-stone-600">
                          {course.level}
                        </span>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            course.is_published ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {course.is_published ? 'Publicado' : 'Rascunho'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Link
                      href={`/admin/cursos/${course.id}`}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-bold text-white"
                    >
                      <Edit3 size={16} />
                      Editar
                    </Link>
                    <button
                      onClick={() => deleteCourse(course.id)}
                      className="inline-flex items-center justify-center rounded-xl border border-red-200 px-4 py-2.5 text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </div>

      {showModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-200 bg-stone-50 p-4 sm:p-6">
              <h2 className="text-lg font-bold text-stone-900 sm:text-xl">Criar Novo Bloco</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-2xl leading-none text-stone-400 hover:text-stone-600"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateCourse} className="space-y-4 overflow-y-auto p-4 sm:p-6">
              <div>
                <label className="mb-1 block text-sm font-bold text-stone-700">Titulo do Bloco</label>
                <input
                  required
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="w-full rounded-lg border border-stone-200 px-4 py-2 outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Ex: Aprendizado"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-stone-700">Descricao</label>
                <textarea
                  required
                  minLength={10}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="h-24 w-full resize-none rounded-lg border border-stone-200 px-4 py-2 outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Fale um pouco sobre a trilha..."
                />
                <p className="mt-1 text-xs text-stone-400">Minimo de 10 caracteres.</p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-stone-700">Nivel de Dificuldade</label>
                <select
                  value={level}
                  onChange={(event) => setLevel(event.target.value)}
                  className="w-full rounded-lg border border-stone-200 bg-white px-4 py-2 outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option>Iniciante</option>
                  <option>Intermediario</option>
                  <option>Avancado</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-stone-700">Imagem de Capa</label>
                <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-4">
                  <div className="flex flex-col gap-4">
                    <div className="relative h-32 w-full overflow-hidden rounded-xl border border-stone-200 bg-white">
                      {thumbnailUrl ? (
                        <img src={thumbnailUrl} alt="Preview" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center gap-2 text-sm text-stone-400">
                          <ImageIcon size={18} />
                          Nenhuma capa enviada
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                      <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-primary-700">
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
                              setShowCropper(true);
                            }
                            event.currentTarget.value = '';
                          }}
                        />
                      </label>

                      {thumbnailUrl ? (
                        <button
                          type="button"
                          onClick={() => setThumbnailUrl('')}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-bold text-stone-600 transition hover:bg-stone-100"
                        >
                          <X size={16} />
                          Remover
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl px-5 py-3 font-bold text-stone-500 transition hover:bg-stone-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-3 font-bold text-white transition hover:bg-primary-700 disabled:opacity-50"
                >
                  {isCreating ? <Loader2 size={18} className="animate-spin" /> : 'Salvar e Continuar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {showCropper && pendingImage && (
        <ImageCropper
          imageFile={pendingImage}
          onCrop={(cropped) => {
            setShowCropper(false);
            setPendingImage(null);
            void handleThumbnailUpload(cropped);
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
