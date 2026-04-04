'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { CreditCard, Loader2, ShoppingCart, Ticket, BookOpen, CheckCircle2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import AuthWall from '@/components/auth/AuthWall';

type CourseOption = {
  id: string;
  title: string;
  level: string;
  description?: string;
};

type TicketLot = {
  id: string;
  name: string;
  price_cents: number;
  quantity: number;
};

type EventOption = {
  id: string;
  title: string;
  start_at: string;
  location?: string;
  is_online?: boolean;
  ticket_lots?: TicketLot[];
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
  const [events, setEvents] = useState<EventOption[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [lotQuantities, setLotQuantities] = useState<Record<string, number>>({});
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [receipt, setReceipt] = useState<any>(null);


  useEffect(() => {
    async function loadData() {
      try {
        const [coursesRes, eventsRes, cartRes] = await Promise.all([
          fetch('/api/courses'),
          fetch('/api/events?includeLots=true'),
          fetch('/api/cart')
        ]);

        const coursesData = await coursesRes.json();
        const eventsData = await eventsRes.json();
        const cartData = await cartRes.json();

        const courseIdParam = searchParams.get('courseId');
        const lotIdParam = searchParams.get('lotId');
        let initialSelected: string[] = [];

        if (courseIdParam) {
          initialSelected = [courseIdParam];
        } else if (Array.isArray(cartData) && cartData.length > 0) {
          initialSelected = cartData.map((item: any) => item.course_id);
        }

        if (lotIdParam) {
          setLotQuantities((prev) => ({ ...prev, [lotIdParam]: prev[lotIdParam] || 1 }));
        }

        setCourses(Array.isArray(coursesData) ? coursesData : []);
        setEvents(Array.isArray(eventsData) ? eventsData : []);
        setSelectedCourses(initialSelected);
      } catch (err) {
        console.error(err);
        setError('Não foi possível carregar os itens de checkout.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalCents = useMemo(() => {
    let courseTotal = 0;
    const selected = courses.filter(c => selectedCourses.includes(c.id));
    selected.forEach(c => {
      courseTotal += Math.round((parseFloat((c as any).price || '0')) * 100);
    });

    const lotsTotal = Object.entries(lotQuantities).reduce((total, [lotId, qty]) => {
      if (!qty || qty < 1) return total;
      const lot = events
        .flatMap((event) => event.ticket_lots || [])
        .find((candidate) => candidate.id === lotId);
      if (!lot) return total;
      return total + lot.price_cents * qty;
    }, 0);

    return courseTotal + lotsTotal;
  }, [events, lotQuantities, selectedCourses, courses]);

  function setLotQuantity(lotId: string, quantity: number) {
    setLotQuantities((prev) => {
      if (quantity <= 0) {
        const updated = { ...prev };
        delete updated[lotId];
        return updated;
      }
      return { ...prev, [lotId]: quantity };
    });
  }

  async function handleCheckout() {
    setSubmitting(true);
    setError('');
    setSuccessMessage('');
    setReceipt(null);

    try {
      if (totalCents > 0) {
        // Redirecionar para Mercado Pago
        const items = selectedCourses.map(id => ({ id, type: 'course', quantity: 1 }));
        // Adicionar ingressos futuramente se necessário
        
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

      // Fluxo Gratuito ou Fallback
      const lots = Object.entries(lotQuantities)
        .filter(([, quantity]) => quantity > 0)
        .map(([lotId, quantity]) => ({ lotId, quantity }));

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseIds: selectedCourses,
          lots,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Falha ao concluir checkout');

      setSuccessMessage(data.message || 'Checkout concluído com sucesso.');
      setReceipt(data);
      setSelectedCourses([]);
      setLotQuantities({});
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

  return (
    <div className="min-h-[calc(100vh-80px)] bg-stone-50 py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-3xl bg-primary-900 p-8 text-white shadow-lg">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-primary-100">
            <ShoppingCart size={24} />
          </div>
          <h1 className="mt-4 text-4xl font-serif font-bold">Revisão do Pedido</h1>
          <p className="mt-3 max-w-3xl text-primary-100">
            Confirme os itens abaixo. Ao finalizar, suas matrículas e bilhetes são liberados imediatamente.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20 text-primary-700">
            <Loader2 className="animate-spin" size={36} />
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1.35fr_0.65fr]">
            <div className="space-y-8">
              <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
                <h2 className="mb-5 flex items-center gap-2 text-2xl font-serif font-bold text-stone-900">
                  <BookOpen size={22} className="text-primary-700" />
                  Cursos do seu Pedido
                </h2>
                <div className="space-y-4">
                  {selectedCourses.length === 0 ? (
                    <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 text-center">
                       <p className="text-sm text-stone-500">Nenhum curso selecionado.</p>
                    </div>
                  ) : (
                    courses.filter(c => selectedCourses.includes(c.id)).map((course) => (
                      <div key={course.id} className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-stone-200 bg-stone-50 items-start sm:items-center justify-between">
                        <div className="flex gap-4 items-center">
                          <div className="w-16 h-12 bg-stone-200 rounded-lg overflow-hidden shrink-0">
                            <img src={(course as any).thumbnail_url || 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80'} className="w-full h-full object-cover" alt={course.title} />
                          </div>
                          <div>
                            <h3 className="font-bold text-stone-900">{course.title}</h3>
                            <span className="text-xs font-bold uppercase text-primary-600 bg-primary-50 px-2 py-0.5 rounded">{course.level}</span>
                          </div>
                        </div>
                        <div className="font-bold text-lg text-stone-900">
                           {parseFloat((course as any).price || '0') > 0 ? 
                             formatMoney(Math.round(parseFloat((course as any).price) * 100)) : 
                             <span className="text-green-600 text-sm">Gratuito</span>
                           }
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
                <h2 className="mb-5 flex items-center gap-2 text-2xl font-serif font-bold text-stone-900">
                  <Ticket size={22} className="text-primary-700" />
                  Eventos e Ingressos
                </h2>
                <div className="space-y-5">
                  {events.length === 0 ? (
                    <p className="text-sm text-stone-500">Nenhum evento disponível no momento.</p>
                  ) : (
                    events.map((event) => (
                      <article key={event.id} className="rounded-xl border border-stone-200 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h3 className="font-bold text-stone-900">{event.title}</h3>
                          <span className="text-xs text-stone-500">
                            {new Date(event.start_at).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-stone-600">
                          {event.is_online ? 'Evento online' : event.location || 'Evento presencial'}
                        </p>

                        <div className="mt-4 space-y-2">
                          {(event.ticket_lots || []).length === 0 ? (
                            <p className="text-xs text-stone-400">Sem lotes disponíveis.</p>
                          ) : (
                            (event.ticket_lots || []).map((lot) => (
                              <div
                                key={lot.id}
                                className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-lg border border-stone-200 px-3 py-2"
                              >
                                <div>
                                  <p className="text-sm font-bold text-stone-800">{lot.name}</p>
                                  <p className="text-xs text-stone-500">
                                    {formatMoney(lot.price_cents)} por ingresso
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setLotQuantity(lot.id, (lotQuantities[lot.id] || 0) - 1)}
                                    className="h-8 w-8 rounded-lg border border-stone-300 text-stone-600 hover:bg-stone-100"
                                  >
                                    -
                                  </button>
                                  <input
                                    type="number"
                                    min={0}
                                    max={10}
                                    value={lotQuantities[lot.id] || 0}
                                    onChange={(e) =>
                                      setLotQuantity(lot.id, Math.max(0, Math.min(10, Number(e.target.value) || 0)))
                                    }
                                    className="w-14 rounded-lg border border-stone-300 px-2 py-1 text-center text-sm"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setLotQuantity(lot.id, (lotQuantities[lot.id] || 0) + 1)}
                                    className="h-8 w-8 rounded-lg border border-stone-300 text-stone-600 hover:bg-stone-100"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </section>
            </div>

            <aside className="h-fit rounded-2xl border border-stone-200 bg-white p-6 shadow-sm lg:sticky lg:top-24">
              <h2 className="text-xl font-serif font-bold text-stone-900">Resumo do Pedido</h2>
              <div className="mt-5 space-y-3 text-sm">
                <div className="flex items-center justify-between text-stone-700">
                  <span>Cursos selecionados</span>
                  <span className="font-bold">{selectedCourses.length}</span>
                </div>
                <div className="flex items-center justify-between text-stone-700">
                  <span>Ingressos selecionados</span>
                  <span className="font-bold">
                    {Object.values(lotQuantities).reduce((sum, qty) => sum + (qty > 0 ? qty : 0), 0)}
                  </span>
                </div>
                <div className="border-t border-stone-200 pt-3">
                  <div className="flex items-center justify-between text-base font-bold text-stone-900">
                    <span>Total</span>
                    <span>{formatMoney(totalCents)}</span>
                  </div>
                  <p className="mt-1 text-xs text-stone-500">
                    Cursos gratuitos são liberados no mesmo fluxo de confirmação.
                  </p>
                </div>
              </div>

              {error ? (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              {successMessage ? (
                <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                  {successMessage}
                </div>
              ) : null}

              <button
                type="button"
                disabled={submitting}
                onClick={handleCheckout}
                className="mt-6 w-full rounded-xl bg-primary-600 px-4 py-3 font-bold text-white transition-colors hover:bg-primary-700 disabled:opacity-60"
              >
                {submitting ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 size={18} className="animate-spin" />
                    Processando...
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <CreditCard size={18} />
                    Finalizar Checkout
                  </span>
                )}
              </button>

              {receipt ? (
                <div className="mt-6 rounded-xl border border-stone-200 bg-stone-50 p-4">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-stone-800">
                    <CheckCircle2 size={16} className="text-green-600" />
                    Itens liberados
                  </h3>
                  <p className="mt-2 text-xs text-stone-600">
                    Pedido: <span className="font-mono">{receipt?.order?.id?.slice(0, 8)}</span>
                  </p>
                  <p className="mt-1 text-xs text-stone-600">
                    Matrículas: <strong>{receipt?.enrollments?.length || 0}</strong>
                  </p>
                  <p className="mt-1 text-xs text-stone-600">
                    Ingressos: <strong>{receipt?.tickets?.length || 0}</strong>
                  </p>
                </div>
              ) : null}
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100vh-80px)] bg-stone-50 py-16 text-center text-stone-500">
          Carregando checkout...
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
