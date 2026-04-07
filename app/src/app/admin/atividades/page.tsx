'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, FileText, Loader2, Search } from 'lucide-react';

type Submission = {
  id: string;
  submittedAt: string;
  updatedAt: string;
  student: {
    id: string;
    name: string;
    email: string;
  };
  course: {
    id: string;
    title: string;
  };
  module: {
    id: string;
    title: string;
  };
  lesson: {
    id: string;
    title: string;
  };
  questions: Array<{ prompt: string }>;
  answers: Array<{ questionIndex: number; answer: string }>;
  adminReply: string;
  adminRepliedAt: string | null;
};

export default function AdminActivitiesPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [savedReplyDrafts, setSavedReplyDrafts] = useState<Record<string, string>>({});
  const [savingReplyId, setSavingReplyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const autoSaveReadyRef = useRef(false);

  useEffect(() => {
    async function loadSubmissions() {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/activity-submissions');
        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(result.error || 'Não foi possível carregar as respostas.');
        }

        const loadedSubmissions = Array.isArray(result.submissions) ? result.submissions : [];
        const loadedDrafts = Object.fromEntries(
          loadedSubmissions.map((submission: Submission) => [submission.id, submission.adminReply || '']),
        );

        autoSaveReadyRef.current = false;
        setSubmissions(loadedSubmissions);
        setReplyDrafts(loadedDrafts);
        setSavedReplyDrafts(loadedDrafts);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Não foi possível carregar as respostas.');
      } finally {
        setLoading(false);
      }
    }

    void loadSubmissions();
  }, []);

  useEffect(() => {
    if (!autoSaveReadyRef.current) {
      autoSaveReadyRef.current = true;
      return;
    }

    const changedEntry = Object.entries(replyDrafts).find(
      ([submissionId, value]) => (savedReplyDrafts[submissionId] || '') !== value,
    );

    if (!changedEntry) return;

    const [submissionId, adminReply] = changedEntry;
    const timer = window.setTimeout(async () => {
      try {
        setSavingReplyId(submissionId);
        setError('');
        setFeedback('');

        const response = await fetch('/api/admin/activity-submissions', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: submissionId,
            adminReply,
          }),
        });

        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(result.error || 'Não foi possível salvar a devolutiva.');
        }

        setSavedReplyDrafts((current) => ({
          ...current,
          [submissionId]: result.adminReply || '',
        }));
        setSubmissions((current) =>
          current.map((submission) =>
            submission.id === submissionId
              ? {
                  ...submission,
                  adminReply: result.adminReply || '',
                  adminRepliedAt: result.adminRepliedAt || null,
                }
              : submission,
          ),
        );
        setFeedback('Devolutiva salva automaticamente.');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Não foi possível salvar a devolutiva.');
      } finally {
        setSavingReplyId(null);
      }
    }, 1200);

    return () => {
      window.clearTimeout(timer);
    };
  }, [replyDrafts, savedReplyDrafts]);

  const courses = useMemo(() => {
    const map = new Map<string, string>();
    submissions.forEach((submission) => {
      if (submission.course?.id) {
        map.set(submission.course.id, submission.course.title);
      }
    });
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
  }, [submissions]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return submissions.filter((submission) => {
      const matchesCourse = courseFilter ? submission.course.id === courseFilter : true;
      const haystack = [
        submission.student.name,
        submission.student.email,
        submission.course.title,
        submission.module.title,
        submission.lesson.title,
      ]
        .join(' ')
        .toLowerCase();

      return matchesCourse && (!term || haystack.includes(term));
    });
  }, [courseFilter, search, submissions]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-stone-500">
        <Loader2 size={28} className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-serif text-stone-900">Respostas das Atividades</h1>
          <p className="mt-2 text-sm text-stone-500">
            Leia o que cada aluna enviou, com identificação do bloco, da aula, da pergunta e da data de envio.
          </p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-700">
          {filtered.length} resposta(s)
        </div>
      </div>

      <div className="grid gap-4 rounded-3xl border border-stone-200 bg-white p-4 md:grid-cols-[1fr,260px]">
        <label className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
          <Search size={18} className="text-stone-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por aluna, bloco ou aula..."
            className="w-full bg-transparent text-sm outline-none"
          />
        </label>

        <select
          value={courseFilter}
          onChange={(event) => setCourseFilter(event.target.value)}
          className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none"
        >
          <option value="">Todos os blocos</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.title}
            </option>
          ))}
        </select>
      </div>

      {feedback ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} />
            {feedback}
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-stone-200 bg-white px-6 py-14 text-center text-stone-500">
          Nenhuma resposta enviada ainda.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((submission) => (
            <article key={submission.id} className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 border-b border-stone-100 pb-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-stone-900">{submission.student.name}</h2>
                  <p className="mt-1 text-sm text-stone-500">{submission.student.email}</p>
                  <div className="mt-4 grid gap-2 text-sm text-stone-600 sm:grid-cols-2">
                    <p>
                      <span className="font-semibold text-stone-800">Bloco:</span> {submission.course.title}
                    </p>
                    <p>
                      <span className="font-semibold text-stone-800">Módulo:</span> {submission.module.title}
                    </p>
                    <p>
                      <span className="font-semibold text-stone-800">Aula:</span> {submission.lesson.title}
                    </p>
                    <p>
                      <span className="font-semibold text-stone-800">Enviado em:</span>{' '}
                      {submission.submittedAt ? new Date(submission.submittedAt).toLocaleString('pt-BR') : '-'}
                    </p>
                  </div>
                </div>
                <div className="text-sm text-stone-500">
                  Atualizado em{' '}
                  {submission.updatedAt ? new Date(submission.updatedAt).toLocaleString('pt-BR') : '-'}
                </div>
              </div>

              <div className="mt-5 space-y-4">
                {submission.questions.map((question, index) => {
                  const answer = submission.answers.find((item) => item.questionIndex === index)?.answer || '';

                  return (
                    <div key={`${submission.id}-${index}`} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                      <div className="flex items-center gap-2 text-sm font-bold text-stone-800">
                        <FileText size={16} className="text-primary-600" />
                        Pergunta {index + 1}
                      </div>
                      <p className="mt-2 text-sm leading-7 text-stone-700">
                        <span className="font-semibold text-stone-800">Texto da pergunta:</span> {question.prompt}
                      </p>
                      <div className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm leading-7 text-stone-700">
                        {answer || 'Resposta em branco.'}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 rounded-2xl border border-primary-900/10 bg-primary-50/40 p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-bold text-stone-800">Devolutiva da administradora</h3>
                  <span className="text-xs text-stone-500">
                    {savingReplyId === submission.id
                      ? 'Salvando...'
                      : submission.adminRepliedAt
                        ? `Atualizada em ${new Date(submission.adminRepliedAt).toLocaleString('pt-BR')}`
                        : 'Salvamento automático ativo'}
                  </span>
                </div>
                <textarea
                  value={replyDrafts[submission.id] || ''}
                  onChange={(event) =>
                    setReplyDrafts((current) => ({
                      ...current,
                      [submission.id]: event.target.value,
                    }))
                  }
                  className="mt-3 min-h-[120px] w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 outline-none focus:border-primary-300 focus:ring-4 focus:ring-primary-100"
                  placeholder="Escreva aqui a resposta que a aluna poderá visualizar dentro da aula..."
                />
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
