'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { CreditCard, Loader2, Ticket, BookOpen, CheckCircle2, ArrowRight, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import AuthWall from '@/components/auth/AuthWall';
import { BRAND_NAME } from '@/lib/constants';

type CourseOption = {
  id: string;
  title: string;
  level: string;
  description?: string;
  thumbnail_url?: string;
  price?: string;
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
  }, [searchParams]);

  const totalCents = useMemo(() => {
    let courseTotal = 0;
    const selected = courses.filter(c => selectedCourses.includes(c.id));
    selected.forEach(c => {
      courseTotal += Math.round((parseFloat(c.price || '0')) * 100);
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
        const items = selectedCourses.map(id => ({ id, type: 'course', quantity: 1 }));
        
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F2ED]">
        <Loader2 className="animate-spin text-[#DBA1A2]" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F2ED] pb-20">
      <div className="mx-auto max-w-7xl px-4 pt-12 sm:px-6 lg:px-8">
        <header className="mb-12">
          <span className="text-[#DBA1A2] text-sm font-bold tracking-widest uppercase ml-1">Finalização</span>
          <h1 className="mt-2 font-serif text-4xl font-medium text-[#422523] md:text-5xl">Revisão do Pedido</h1>
          <p className="mt-4 text-[#422523]/60 max-w-2xl leading-relaxed">
            Confirme os itens da sua jornada. Toda transformação começa com um sim intencional.
          </p>
        </header>

        <div className="grid gap-12 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-8">
            <section className="bg-white rounded-[32px] border border-[#E7D8D8] p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-8 border-b border-[#F7F2ED] pb-6">
                <BookOpen size={24} className="text-[#DBA1A2]" />
                <h2 className="font-serif text-2xl font-medium text-[#422523]">Sua Seleção de Cursos</h2>
              </div>
              <div className="space-y-4">
                {selectedCourses.length === 0 ? (
                  <div className="py-12 text-center bg-[#F7F2ED]/30 rounded-2xl border border-dashed border-[#E7D8D8]">
                    <p className="text-[#422523]/40 text-sm">Nenhum curso selecionado no momento.</p>
                  </div>
                ) : (
                  courses.filter(c => selectedCourses.includes(c.id)).map((course) => (
                    <div key={course.id} className="flex flex-col sm:flex-row gap-6 p-6 rounded-2xl border border-[#E7D8D8] bg-white items-start sm:items-center justify-between group hover:border-[#DBA1A2] transition-colors">
                      <div className="flex gap-5 items-center">
                        <div className="w-20 h-14 bg-[#F7F2ED] rounded-xl overflow-hidden shrink-0 border border-[#E7D8D8]">
                          <img 
                            src={course.thumbnail_url || 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80'} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                            alt={course.title} 
                          />
                        </div>
                        <div>
                          <h3 className="font-serif text-lg font-medium text-[#422523]">{course.title}</h3>
                          <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-widest text-[#DBA1A2] bg-[#F7F2ED] px-2 py-0.5 rounded-full">
                            {course.level}
                          </span>
                        </div>
                      </div>
                      <div className="font-serif text-xl font-medium text-[#422523]">
                        {parseFloat(course.price || '0') > 0 ? 
                          formatMoney(Math.round(parseFloat(course.price!) * 100)) : 
                          <span className="text-[#DBA1A2]">Incluso</span>
                        }
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="bg-white rounded-[32px] border border-[#E7D8D8] p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-8 border-b border-[#F7F2ED] pb-6">
                <Ticket size={24} className="text-[#DBA1A2]" />
                <h2 className="font-serif text-2xl font-medium text-[#422523]">Eventos Presenciais e Online</h2>
              </div>
              <div className="space-y-6">
                {events.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-[#422523]/40 text-sm italic">Nenhum evento com inscrições abertas agora.</p>
                  </div>
                ) : (
                  events.map((event) => (
                    <article key={event.id} className="rounded-2xl border border-[#E7D8D8] p-6 bg-white overflow-hidden">
                      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                        <div>
                          <h3 className="font-serif text-xl font-medium text-[#422523]">{event.title}</h3>
                          <p className="mt-1 text-xs text-[#422523]/50">
                            {event.is_online ? 'Acesso via Plataforma Online' : (event.location || 'Local a definir')}
                          </p>
                        </div>
                        <div className="bg-[#F7F2ED] px-3 py-1.5 rounded-xl text-center min-w-[70px]">
                           <span className="block text-[10px] font-bold text-[#DBA1A2] uppercase tracking-tighter">DATA</span>
                           <span className="block text-sm font-serif font-medium text-[#422523]">
                              {new Date(event.start_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                           </span>
                        </div>
                      </div>

                      <div className="mt-6 space-y-3">
                        {(event.ticket_lots || []).map((lot) => (
                          <div
                            key={lot.id}
                            className="grid grid-cols-[1fr_auto] items-center gap-4 rounded-xl border border-[#F7F2ED] bg-[#F7F2ED]/30 px-5 py-4"
                          >
                            <div>
                              <p className="text-sm font-bold text-[#422523]">{lot.name}</p>
                              <p className="text-xs text-[#422523]/50 mt-1">
                                {formatMoney(lot.price_cents)} por pessoa
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => setLotQuantity(lot.id, (lotQuantities[lot.id] || 0) - 1)}
                                className="h-8 w-8 rounded-lg border border-[#E7D8D8] bg-white text-[#422523] hover:bg-[#F7F2ED] transition-colors flex items-center justify-center font-bold"
                              >
                                -
                              </button>
                              <span className="w-8 text-center text-sm font-bold text-[#422523]">
                                {lotQuantities[lot.id] || 0}
                              </span>
                              <button
                                type="button"
                                onClick={() => setLotQuantity(lot.id, (lotQuantities[lot.id] || 0) + 1)}
                                className="h-8 w-8 rounded-lg border border-[#E7D8D8] bg-white text-[#422523] hover:bg-[#F7F2ED] transition-colors flex items-center justify-center font-bold"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          </div>

          <aside className="relative">
            <div className="sticky top-24 space-y-6">
              <div className="bg-[#422523] text-[#F7F2ED] rounded-[32px] p-8 shadow-xl overflow-hidden relative">
                <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-[#DBA1A2]/10 rounded-full blur-3xl" />
                
                <h2 className="text-2xl font-serif font-medium mb-8">Resumo Final</h2>
                
                <div className="space-y-4 text-sm">
                  <div className="flex items-center justify-between text-[#E7D8D8]/70">
                    <span>Trilhas Literárias</span>
                    <span className="font-serif text-lg">{selectedCourses.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-[#E7D8D8]/70 border-b border-white/10 pb-4">
                    <span>Encontros (Vagas)</span>
                    <span className="font-serif text-lg">
                      {Object.values(lotQuantities).reduce((sum, qty) => sum + (qty > 0 ? qty : 0), 0)}
                    </span>
                  </div>
                  
                  <div className="pt-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-[#E7D8D8]/90">Investimento Total</span>
                    </div>
                    <span className="block mt-2 text-4xl font-serif font-medium text-white">
                      {formatMoney(totalCents)}
                    </span>
                  </div>
                </div>

                {error && (
                  <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-100 text-xs flex items-center gap-2">
                    <AlertCircle size={14} />
                    {error}
                  </div>
                )}

                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleCheckout}
                  className="mt-10 w-full bg-[#DBA1A2] hover:bg-[#D48F90] text-white py-5 rounded-2xl font-bold transition-all active:scale-[0.98] shadow-lg shadow-black/20 flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <CreditCard size={20} />
                      Finalizar Inscrição
                    </>
                  )}
                </button>
              </div>

              {receipt && (
                <div className="bg-white rounded-[32px] border border-[#DBA1A2] p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-3 text-[#DBA1A2] mb-4">
                    <CheckCircle2 size={24} />
                    <h3 className="font-serif text-xl font-medium text-[#422523]">Pedido Confirmado</h3>
                  </div>
                  <p className="text-sm text-[#422523]/60 leading-relaxed mb-6">
                    Seja bem-vinda ao {BRAND_NAME}. Suas jornadas já estão liberadas na sua área de aluna.
                  </p>
                  <Link 
                    href="/trilhas" 
                    className="w-full inline-flex items-center justify-center gap-2 py-4 bg-[#F7F2ED] text-[#422523] rounded-2xl font-bold hover:bg-[#E7D8D8] transition-colors"
                  >
                    Acessar Minhas Trilhas <ArrowRight size={18} />
                  </Link>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F7F2ED] flex items-center justify-center">
          <Loader2 className="animate-spin text-[#DBA1A2]" size={40} />
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
