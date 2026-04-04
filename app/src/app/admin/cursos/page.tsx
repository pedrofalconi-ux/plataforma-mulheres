'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Search, Edit3, Trash2, Loader2, BookOpen } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function AdminCursosPage() {
  const supabase = createClient();
  const router = useRouter();
  
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState('Iniciante');
  const [price, setPrice] = useState('0.00');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const fetchCourses = async () => {
    const { data } = await supabase.from('courses').select('id, title, level, is_published, thumbnail_url, created_at').order('created_at', { ascending: false });
    setCourses(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsCreating(true);
    try {
      const response = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          level,
          price: parseFloat(price) || 0,
          thumbnail_url: thumbnailUrl
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar trilha');
      }

      router.push(`/admin/cursos/${data.id}`);
    } catch (error: any) {
      console.error(error);
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
      setCourses(courses.filter(c => c.id !== id));
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-stone-900">Gestão de Trilhas</h1>
          <p className="text-stone-500">Crie e organize as trilhas e vídeos da plataforma.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-primary-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-primary-700 transition"
        >
          <Plus size={20} /> Nova Trilha
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="p-4 border-b border-stone-200 bg-stone-50/50 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
            <input type="text" placeholder="Buscar trilhas..." className="w-full pl-10 pr-4 py-2 rounded-lg border border-stone-200 outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center text-stone-400"><Loader2 className="animate-spin" size={32} /></div>
        ) : courses.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center text-stone-400 mb-4"><BookOpen size={32} /></div>
            <h3 className="text-lg font-bold text-stone-800 mb-1">Nenhuma trilha encontrada</h3>
            <p className="text-stone-500 max-w-sm mb-6">Você ainda não tem cursos cadastrados. Clique no botão acima para começar.</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-stone-50 text-stone-500 text-xs uppercase font-bold border-b border-stone-200">
              <tr>
                <th className="px-6 py-4">Trilha</th>
                <th className="px-6 py-4">Nível</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {courses.map(course => (
                <tr key={course.id} className="hover:bg-stone-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-20 rounded-lg overflow-hidden border border-stone-200 bg-stone-100 flex-shrink-0">
                        {course.thumbnail_url ? (
                          <img src={course.thumbnail_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-stone-400">
                            <BookOpen size={16} />
                          </div>
                        )}
                      </div>
                      <span className="font-bold text-stone-800">{course.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-stone-600">
                    <span className="bg-stone-100 text-stone-600 px-3 py-1 rounded-full text-xs font-bold">{course.level}</span>
                  </td>
                  <td className="px-6 py-4">
                    {course.is_published 
                      ? <span className="text-green-600 font-bold text-sm flex items-center gap-1">● Publicado</span> 
                      : <span className="text-amber-500 font-bold text-sm flex items-center gap-1">● Rascunho</span>}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center gap-3 justify-end">
                      <Link href={`/admin/cursos/${course.id}`} className="text-primary-600 hover:text-primary-800 font-bold flex items-center gap-1">
                        <Edit3 size={16} /> Editar
                      </Link>
                      <button onClick={() => deleteCourse(course.id)} className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Nova Trilha */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-stone-200 flex justify-between items-center bg-stone-50">
              <h2 className="font-bold text-xl text-stone-900">Criar Nova Trilha</h2>
              <button onClick={() => setShowModal(false)} className="text-stone-400 hover:text-stone-600 text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleCreateCourse} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">Título da Trilha</label>
                <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-stone-200 focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Ex: Bioética Avançada" />
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">Descrição</label>
                <textarea required value={description} onChange={e => setDescription(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-stone-200 focus:ring-2 focus:ring-primary-500 outline-none resize-none h-24" placeholder="Fale um pouco sobre o curso..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1">Nível de Dificuldade</label>
                  <select value={level} onChange={e => setLevel(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-stone-200 focus:ring-2 focus:ring-primary-500 outline-none bg-white">
                    <option>Iniciante</option>
                    <option>Intermediário</option>
                    <option>Avançado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1">Preço (R$)</label>
                  <input type="number" step="0.01" min="0" value={price} onChange={e => setPrice(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-stone-200 focus:ring-2 focus:ring-primary-500 outline-none bg-white" placeholder="0.00" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">URL da Imagem de Capa</label>
                <input type="url" value={thumbnailUrl} onChange={e => setThumbnailUrl(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-stone-200 focus:ring-2 focus:ring-primary-500 outline-none" placeholder="https://exemplo.com/imagem.jpg" />
                {thumbnailUrl && (
                  <div className="mt-2 relative h-32 w-full rounded-xl overflow-hidden border border-stone-200 bg-stone-50">
                    <img src={thumbnailUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
              
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-xl font-bold text-stone-500 hover:bg-stone-100 transition">Cancelar</button>
                <button type="submit" disabled={isCreating} className="bg-primary-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-primary-700 transition disabled:opacity-50">
                  {isCreating ? <Loader2 size={18} className="animate-spin" /> : 'Salvar e Continuar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
