'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Plus, Trash2, X, BookOpen, CheckCircle2 } from 'lucide-react';

interface EnrollmentModalProps {
  userId: string;
  userName: string;
  onClose: () => void;
}

type EnrollmentWithCourse = {
  id: string;
  course_id: string;
  courses: {
    title: string;
  };
  enrolled_at: string;
};

type CourseOption = {
  id: string;
  title: string;
};

export function EnrollmentModal({ userId, userName, onClose }: EnrollmentModalProps) {
  const [enrollments, setEnrollments] = useState<EnrollmentWithCourse[]>([]);
  const [availableCourses, setAvailableCourses] = useState<CourseOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const supabase = createClient();

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Matrículas atuais
      const { data: enrollData, error: enrollError } = await supabase
        .from('enrollments')
        .select('id, course_id, enrolled_at, courses(title)')
        .eq('profile_id', userId);

      if (enrollError) throw enrollError;
      setEnrollments(enrollData as any || []);

      // 2. Todos os cursos para o seletor
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('id, title')
        .eq('is_published', true)
        .order('title');

      if (coursesError) throw coursesError;
      
      // Filtrar cursos que o usuário já possui
      const existingCourseIds = new Set((enrollData || []).map(e => e.course_id));
      const filtered = (coursesData || []).filter(c => !existingCourseIds.has(c.id));
      
      setAvailableCourses(filtered);
    } catch (err) {
      console.error('Error fetching enrollments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userId]);

  const handleAddEnrollment = async () => {
    if (!selectedCourseId) return;
    setActionLoading('add');
    try {
      const { error } = await supabase
        .from('enrollments')
        .insert({
          profile_id: userId,
          course_id: selectedCourseId,
          status: 'active'
        });

      if (error) throw error;
      
      setSelectedCourseId('');
      await fetchData();
    } catch (err) {
      console.error('Error adding enrollment:', err);
      alert('Erro ao adicionar matrícula.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveEnrollment = async (enrollmentId: string) => {
    if (!confirm('Tem certeza que deseja remover esta matrícula?')) return;
    setActionLoading(enrollmentId);
    try {
      const { error } = await supabase
        .from('enrollments')
        .delete()
        .eq('id', enrollmentId);

      if (error) throw error;
      await fetchData();
    } catch (err) {
      console.error('Error removing enrollment:', err);
      alert('Erro ao remover matrícula.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-stone-100 p-6">
          <div>
            <h2 className="text-xl font-bold text-stone-900">Gerenciar Matrículas</h2>
            <p className="text-sm text-stone-500">{userName}</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-stone-100 transition">
            <X size={20} className="text-stone-400" />
          </button>
        </div>

        <div className="p-6">
          {/* Adicionar Nova Matrícula */}
          <div className="mb-8 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">Liberar Novo Curso</h3>
            <div className="flex gap-2">
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                disabled={loading || actionLoading === 'add'}
                className="flex-1 rounded-xl border border-stone-200 bg-stone-50 px-4 py-2 text-sm outline-none focus:border-primary-400"
              >
                <option value="">Selecionar curso...</option>
                {availableCourses.map(course => (
                  <option key={course.id} value={course.id}>{course.title}</option>
                ))}
              </select>
              <button
                onClick={handleAddEnrollment}
                disabled={!selectedCourseId || loading || actionLoading === 'add'}
                className="flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-primary-700 disabled:opacity-50"
              >
                {actionLoading === 'add' ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                Adicionar
              </button>
            </div>
          </div>

          {/* Listagem de Matrículas Atuais */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">Cursos Atuais ({enrollments.length})</h3>
            
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin text-primary-600" size={24} />
              </div>
            ) : enrollments.length === 0 ? (
              <div className="rounded-xl bg-stone-50 p-6 text-center text-sm text-stone-400 border border-dashed border-stone-200">
                Este usuário ainda não possui matrículas.
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto pr-2 space-y-2">
                {enrollments.map((enr) => (
                  <div key={enr.id} className="flex items-center justify-between rounded-xl border border-stone-100 bg-stone-50 p-3 hover:bg-white transition-all shadow-sm group">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-primary-100 p-2 text-primary-600">
                        <BookOpen size={16} />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-stone-800">{enr.courses?.title}</div>
                        <div className="text-[10px] text-stone-400 uppercase tracking-tighter">Desde {new Date(enr.enrolled_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveEnrollment(enr.id)}
                      disabled={actionLoading === enr.id}
                      className="rounded-lg p-2 text-stone-400 hover:bg-red-50 hover:text-red-600 transition opacity-0 group-hover:opacity-100"
                    >
                      {actionLoading === enr.id ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-stone-100 p-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl border border-stone-200 px-6 py-2 text-sm font-bold text-stone-600 hover:bg-stone-50 transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
