'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { CreditCard, Loader2, BookOpen, CheckCircle2, ArrowRight, AlertCircle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import AuthWall from '@/components/auth/AuthWall';
import { BRAND_NAME } from '@/lib/constants';
import { EditorialButtonLink, EditorialPanel, PageSection, SectionIntro } from '@/components/brand/Editorial';

type CourseOption = {
  id: string;
  title: string;
  level: string;
  description?: string;
  thumbnail_url?: string;
  price?: string;
};

function formatMoney(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [coursesRes, cartRes] = await Promise.all([
          fetch('/api/courses'),
          fetch('/api/cart'),
        ]);

        const coursesData = await coursesRes.json();
        const cartData = await cartRes.json();

        const courseIdParam = searchParams.get('courseId');
        let initialSelected: string[] = [];

        if (courseIdParam) {
          initialSelected = [courseIdParam];
        } else if (Array.isArray(cartData) && cartData.length > 0) {
          initialSelected = cartData.map((item: any) => item.course_id);
        }

        setCourses(Array.isArray(coursesData) ? coursesData : []);
        setSelectedCourses(initialSelected);
      } catch (err) {
        console.error(err);
        setError('Não foi possível carregar os itens do checkout.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [searchParams]);

  const totalCents = useMemo(() => {
    let courseTotal = 0;
    const selected = courses.filter((course) => selectedCourses.includes(course.id));
    selected.forEach((course) => {
      courseTotal += Math.round(parseFloat(course.price || '0') * 100);
    });
    return courseTotal;
  }, [selectedCourses, courses]);

  async function handleCheckout() {
    setSubmitting(true);
    setError('');
    setReceipt(null);

    try {
      if (totalCents > 0) {
        const items = selectedCourses.map((id) => ({ id, type: 'course', quantity: 1 }));

        const response = await fetch('/api/checkout/preference', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Falha ao iniciar pagamento');

        if (data.init_point) {
          window.location.href = data.init_point;
          return;
        }
      }

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseIds: selectedCourses,
          lots: [],
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Falha ao concluir checkout');

      setReceipt(data);
      setSelectedCourses([]);
      window.dispatchEvent(new Event('cart-updated'));
    } catch (err: any) {
      setError(err?.message || 'Erro inesperado ao finalizar checkout.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!isAuthenticated) {
    return <AuthWall />;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f1ec]">
        <Loader2 className="animate-spin text-primary-700" size={40} />
      </div>
    );
  }

  return (
    <PageSection className="pb-20 pt-12">
      <SectionIntro
        eyebrow="Checkout"
        title="Revise o seu pedido com calma."
        description="O fluxo agora esta focado apenas nas trilhas e materiais da plataforma."
      />

      <div className="mt-12 grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-8">
          <EditorialPanel className="p-8">
            <div className="mb-8 flex items-center gap-3 border-b border-primary-900/10 pb-6">
              <BookOpen size={24} className="text-primary-700" />
              <h2 className="text-3xl text-primary-900">Sua selecao de trilhas</h2>
            </div>

            <div className="space-y-4">
              {selectedCourses.length === 0 ? (
                <div className="border border-dashed border-primary-900/15 px-6 py-10 text-center">
                  <p className="text-sm text-primary-900/55">Nenhuma trilha selecionada no momento.</p>
                </div>
              ) : (
                courses
                  .filter((course) => selectedCourses.includes(course.id))
                  .map((course) => (
                    <div key={course.id} className="flex flex-col gap-5 border border-primary-900/10 p-5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-5">
                        <div className="h-16 w-24 shrink-0 overflow-hidden border border-primary-900/10 bg-primary-50">
                          <img
                            src={course.thumbnail_url || 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80'}
                            className="h-full w-full object-cover"
                            alt={course.title}
                          />
                        </div>
                        <div>
                          <h3 className="text-3xl leading-none text-primary-900">{course.title}</h3>
                          <span className="mt-2 inline-block border border-primary-900/10 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-primary-900/68">
                            {course.level}
                          </span>
                        </div>
                      </div>

                      <div className="text-2xl text-primary-900">
                        {parseFloat(course.price || '0') > 0 ? (
                          formatMoney(Math.round(parseFloat(course.price || '0') * 100))
                        ) : (
                          <span className="text-primary-700">Incluso</span>
                        )}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </EditorialPanel>
        </div>

        <aside className="space-y-6">
          <EditorialPanel className="bg-primary-900 p-8 text-white">
            <h2 className="text-4xl leading-none text-white">Resumo final</h2>
            <div className="mt-8 space-y-4 border-t border-white/12 pt-6 text-sm">
              <div className="flex items-center justify-between uppercase tracking-[0.16em] text-white/72">
                <span>Trilhas</span>
                <span>{selectedCourses.length}</span>
              </div>
              <div className="flex items-center justify-between border-t border-white/10 pt-4 text-white/92">
                <span>Investimento total</span>
                <span className="text-4xl text-white">{formatMoney(totalCents)}</span>
              </div>
            </div>

            {error ? (
              <div className="mt-6 flex items-center gap-2 border border-red-400/30 bg-red-500/10 px-4 py-4 text-xs text-red-100">
                <AlertCircle size={14} />
                {error}
              </div>
            ) : null}

            <button
              type="button"
              disabled={submitting}
              onClick={handleCheckout}
              className="button-primary mt-8 w-full !justify-center !bg-white !text-primary-900 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Processando
                </>
              ) : (
                <>
                  <CreditCard size={18} />
                  Finalizar inscricao
                </>
              )}
            </button>
          </EditorialPanel>

          {receipt ? (
            <EditorialPanel className="p-8">
              <div className="mb-4 flex items-center gap-3 text-primary-700">
                <CheckCircle2 size={24} />
                <h3 className="text-3xl text-primary-900">Pedido confirmado</h3>
              </div>
              <p className="text-sm leading-7 text-primary-900/72">
                Seja bem-vinda ao {BRAND_NAME}. Seu acesso ja esta disponivel na area de aprendizado.
              </p>
              <EditorialButtonLink href="/trilhas" className="mt-6 w-full sm:w-auto">
                Ir para meu aprendizado <ArrowRight size={18} />
              </EditorialButtonLink>
            </EditorialPanel>
          ) : null}
        </aside>
      </div>
    </PageSection>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f7f1ec] flex items-center justify-center">
          <Loader2 className="animate-spin text-primary-700" size={40} />
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
