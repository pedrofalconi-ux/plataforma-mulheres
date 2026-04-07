'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, FileText, Loader2 } from 'lucide-react';

type Question = {
  prompt: string;
};

type Answer = {
  questionIndex: number;
  answer: string;
};

type Submission = {
  answers?: Answer[];
  adminReply?: string;
  adminRepliedAt?: string | null;
};

function normalizeQuestions(rawQuestions: unknown): Question[] {
  if (!Array.isArray(rawQuestions)) return [];

  return rawQuestions
    .map((item) => {
      if (typeof item === 'string') {
        const prompt = item.trim();
        return prompt ? { prompt } : null;
      }

      if (!item || typeof item !== 'object') return null;

      const prompt = String((item as Record<string, unknown>).prompt || '').trim();
      return prompt ? { prompt } : null;
    })
    .filter((item): item is Question => Boolean(item));
}

export default function LessonActivity({
  lessonId,
  initialQuestions,
}: {
  lessonId: string;
  initialQuestions: Question[];
}) {
  const normalizedInitialQuestions = useMemo(() => normalizeQuestions(initialQuestions), [initialQuestions]);
  const [serverQuestions, setServerQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [adminReply, setAdminReply] = useState('');
  const [adminRepliedAt, setAdminRepliedAt] = useState<string | null>(null);
  const [savedQuestionIndexes, setSavedQuestionIndexes] = useState<number[]>([]);
  const [lastSavedAnswers, setLastSavedAnswers] = useState<string[]>([]);
  const answersInitializedRef = useRef(false);
  const skipAutoSaveRef = useRef(true);
  const questions = normalizedInitialQuestions.length > 0 ? normalizedInitialQuestions : serverQuestions;

  useEffect(() => {
    let mounted = true;

    async function loadActivity() {
      try {
        setLoading(true);
        setError('');
        setFeedback('');

        const response = await fetch(`/api/lessons/${lessonId}/activity`);
        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(result.error || 'Não foi possível carregar a atividade.');
        }

        const loadedQuestions = normalizeQuestions(result.questions);
        const effectiveQuestions = normalizedInitialQuestions.length > 0 ? normalizedInitialQuestions : loadedQuestions;
        const submission: Submission | null =
          result.submission && typeof result.submission === 'object' ? result.submission : null;
        const submissionAnswers = Array.isArray(submission?.answers) ? submission.answers : [];
        const savedAnswers = new Map<number, string>(
          submissionAnswers.map((item: Answer) => [item.questionIndex, item.answer]),
        );
        const nextAnswers = effectiveQuestions.map((_, index) => savedAnswers.get(index) || '');

        if (!mounted) return;

        skipAutoSaveRef.current = true;
        answersInitializedRef.current = true;
        setServerQuestions(loadedQuestions);
        setAnswers(nextAnswers);
        setLastSavedAnswers(nextAnswers);
        setSavedQuestionIndexes(
          submissionAnswers
            .filter((item) => typeof item.answer === 'string' && item.answer.trim().length > 0)
            .map((item) => item.questionIndex),
        );
        setAdminReply(typeof submission?.adminReply === 'string' ? submission.adminReply : '');
        setAdminRepliedAt(submission?.adminRepliedAt || null);
      } catch (err) {
        if (!mounted) return;
        skipAutoSaveRef.current = true;
        answersInitializedRef.current = true;
        const emptyAnswers = normalizedInitialQuestions.map(() => '');
        setServerQuestions([]);
        setAnswers(emptyAnswers);
        setLastSavedAnswers(emptyAnswers);
        setSavedQuestionIndexes([]);
        setAdminReply('');
        setAdminRepliedAt(null);
        setError(err instanceof Error ? err.message : 'Não foi possível carregar a atividade.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadActivity();

    return () => {
      mounted = false;
    };
  }, [lessonId, normalizedInitialQuestions]);

  useEffect(() => {
    if (!answersInitializedRef.current) return;
    if (skipAutoSaveRef.current) {
      skipAutoSaveRef.current = false;
      return;
    }

    if (answers.length === 0) return;
    if (JSON.stringify(answers) === JSON.stringify(lastSavedAnswers)) return;

    const timer = window.setTimeout(async () => {
      try {
        setIsSaving(true);
        setError('');
        setFeedback('');

        const payload = {
          answers: answers.map((answer, questionIndex) => ({
            questionIndex,
            answer,
          })),
        };

        const response = await fetch(`/api/lessons/${lessonId}/activity`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(result.error || 'Não foi possível salvar sua atividade.');
        }

        const returnedAnswers = Array.isArray(result.submission?.answers) ? result.submission.answers : [];
        setSavedQuestionIndexes(
          returnedAnswers
            .filter((item: Answer) => typeof item.answer === 'string' && item.answer.trim().length > 0)
            .map((item: Answer) => item.questionIndex),
        );
        setLastSavedAnswers(answers);
        setAdminReply(typeof result.submission?.adminReply === 'string' ? result.submission.adminReply : adminReply);
        setAdminRepliedAt(result.submission?.adminRepliedAt || adminRepliedAt);
        setFeedback('Salvo automaticamente.');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Não foi possível salvar sua atividade.');
      } finally {
        setIsSaving(false);
      }
    }, 1200);

    return () => {
      window.clearTimeout(timer);
    };
  }, [adminRepliedAt, adminReply, answers, lastSavedAnswers, lessonId]);

  const answeredCount = useMemo(
    () => answers.filter((item) => item.trim().length > 0).length,
    [answers],
  );

  if (loading) {
    return (
      <div className="flex justify-center py-10 text-stone-400">
        <Loader2 size={24} className="animate-spin" />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="rounded-[28px] border border-dashed border-stone-200 bg-white px-6 py-10 text-center text-sm text-stone-500">
        Esta aula ainda não possui atividade escrita cadastrada.
      </div>
    );
  }

  return (
    <div className="rounded-[28px] border border-primary-900/8 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 border-b border-stone-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-100 text-primary-700">
            <FileText size={20} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-stone-900">Atividade da Aula</h3>
            <p className="text-sm text-stone-500">
              Suas respostas são salvas automaticamente enquanto você escreve.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-stone-100 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-stone-600">
            {answeredCount}/{questions.length} respondidas
          </div>
          <div className="text-xs font-medium text-stone-500">
            {isSaving ? 'Salvando...' : 'Salvamento automático ativo'}
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-5">
        {questions.map((question, index) => {
          const alreadySaved = savedQuestionIndexes.includes(index);

          return (
            <div key={`${question.prompt}-${index}`} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <label className="block text-sm font-bold text-stone-800">Pergunta {index + 1}</label>
                {alreadySaved ? (
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700">
                    Salva
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-sm leading-7 text-stone-700">{question.prompt}</p>
              <textarea
                value={answers[index] || ''}
                onChange={(event) =>
                  setAnswers((current) =>
                    current.map((item, answerIndex) => (answerIndex === index ? event.target.value : item)),
                  )
                }
                className="mt-4 min-h-[140px] w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 outline-none transition focus:border-primary-300 focus:ring-4 focus:ring-primary-100"
                placeholder="Escreva sua resposta aqui..."
              />
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-2xl border border-primary-900/10 bg-primary-50/40 p-4">
        <div className="flex items-center justify-between gap-3">
          <h4 className="text-sm font-bold text-stone-800">Resposta de Nathi</h4>
          <span className="text-xs text-stone-500">
            {adminRepliedAt ? `Enviada em ${new Date(adminRepliedAt).toLocaleString('pt-BR')}` : 'Aguardando resposta'}
          </span>
        </div>
        <div className="mt-3 rounded-2xl bg-white px-4 py-3 text-sm leading-7 text-stone-700">
          {adminReply || 'Assim que Nathi visualizar sua atividade, ela poderá responder aqui. Volte depois para acompanhar o comentário.'}
        </div>
      </div>

      {feedback ? (
        <div className="mt-5 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 size={18} />
          {feedback}
        </div>
      ) : null}

      {error ? (
        <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
    </div>
  );
}
