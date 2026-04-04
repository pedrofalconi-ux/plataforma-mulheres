'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  MapPin,
  Clock,
  Video,
  CheckCircle2,
  Loader2,
  Sparkles,
  Ticket,
  ShoppingCart,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

type EventItem = {
  id: string;
  title: string;
  description: string | null;
  start_at: string;
  end_at: string | null;
  location: string | null;
  is_online: boolean;
  stream_url: string | null;
  is_registered?: boolean;
  ticket_lots?: Array<{
    id: string;
    name: string;
    price_cents: number;
  }>;
};

type EventMessage = {
  type: 'success' | 'info' | 'error';
  text: string;
};

export default function EventosPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [registerLoading, setRegisterLoading] = useState<string | null>(null);
  const [checkinLoading, setCheckinLoading] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, EventMessage>>({});

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/events?includeLots=true');
      const data = await res.json();
      if (Array.isArray(data)) setEvents(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const setEventMessage = (eventId: string, message: EventMessage) => {
    setMessages((prev) => ({ ...prev, [eventId]: message }));
  };

  const handleRegister = async (eventId: string) => {
    if (!user) {
      setEventMessage(eventId, { type: 'info', text: 'Faça login para realizar sua inscrição.' });
      return;
    }

    setRegisterLoading(eventId);
    setEventMessage(eventId, { type: 'info', text: 'Processando inscrição...' });

    try {
      const res = await fetch('/api/events/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: eventId }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao inscrever no evento.');
      }

      setEvents((prev) => prev.map((event) => (event.id === eventId ? { ...event, is_registered: true } : event)));
      setEventMessage(eventId, {
        type: data.alreadyRegistered ? 'info' : 'success',
        text: data.message || 'Inscrição confirmada.',
      });
    } catch (error: any) {
      setEventMessage(eventId, { type: 'error', text: error.message || 'Falha na inscrição.' });
    } finally {
      setRegisterLoading(null);
    }
  };

  const handleCheckin = async (eventId: string) => {
    if (!user) {
      setEventMessage(eventId, { type: 'info', text: 'Faça login para realizar check-in.' });
      return;
    }

    setCheckinLoading(eventId);
    setEventMessage(eventId, { type: 'info', text: 'Processando check-in...' });

    try {
      const res = await fetch('/api/events/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: eventId }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao realizar check-in.');
      }

      setEventMessage(eventId, {
        type: data.alreadyCheckedIn ? 'info' : 'success',
        text: data.message || 'Check-in confirmado.',
      });
    } catch (error: any) {
      setEventMessage(eventId, { type: 'error', text: error.message || 'Falha no check-in.' });
    } finally {
      setCheckinLoading(null);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-stone-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary-200 bg-primary-100 text-primary-700 shadow-sm">
            <Calendar size={32} />
          </div>
          <div>
            <h1 className="font-serif text-3xl font-bold text-stone-900">Calendário de Eventos</h1>
            <p className="text-stone-500">Divulgação, inscrições e check-in da agenda comunitária.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center p-20 text-primary-600">
            <Loader2 size={40} className="animate-spin" />
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-stone-200 bg-white p-16 text-center shadow-sm">
            <Sparkles size={48} className="mb-4 text-stone-300" />
            <h3 className="text-xl font-bold text-stone-800">Nenhum evento futuro</h3>
            <p className="mt-2 text-stone-500">Nossa equipe está preparando novos encontros. Volte em breve.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => {
              const startDate = new Date(event.start_at);
              const isPast = startDate < new Date();
              const eventMessage = messages[event.id];
              const isRegistered = !!event.is_registered;

              return (
                <article
                  key={event.id}
                  className="flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex items-center justify-between border-b border-stone-200 bg-stone-100 p-4">
                    <div className="flex flex-col">
                      <span className="text-lg font-bold leading-none text-primary-700">
                        {startDate.getDate().toString().padStart(2, '0')}
                      </span>
                      <span className="text-xs font-bold uppercase text-stone-500">
                        {startDate.toLocaleDateString('pt-BR', { month: 'short' })}
                      </span>
                    </div>
                    {event.is_online ? (
                      <span className="flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs font-bold text-blue-700">
                        <Video size={12} /> Online
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-700">
                        <MapPin size={12} /> Presencial
                      </span>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="mb-2 text-lg font-bold leading-tight text-stone-900">{event.title}</h3>
                    <p className="mb-4 flex-1 line-clamp-3 text-sm text-stone-600">{event.description || 'Sem descrição.'}</p>

                    <div className="mb-5 space-y-2">
                      <div className="flex items-center gap-2 text-sm text-stone-500">
                        <Clock size={16} />
                        {startDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        {event.end_at
                          ? ` - ${new Date(event.end_at).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}`
                          : ''}
                      </div>

                      {!event.is_online && event.location ? (
                        <div className="flex items-center gap-2 text-sm text-stone-500">
                          <MapPin size={16} />
                          <span className="truncate">{event.location}</span>
                        </div>
                      ) : null}

                      {event.is_online && event.stream_url && isRegistered ? (
                        <a
                          href={event.stream_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-sm font-semibold text-primary-700 hover:underline"
                        >
                          <Video size={14} />
                          Acessar transmissão
                        </a>
                      ) : null}

                      {(event.ticket_lots || []).length > 0 ? (
                        <div className="rounded-lg border border-stone-200 bg-stone-50 p-2">
                          <p className="text-xs font-bold uppercase text-stone-500">Lotes disponíveis</p>
                          <div className="mt-1 space-y-1">
                            {(event.ticket_lots || []).slice(0, 2).map((lot) => (
                              <div key={lot.id} className="flex items-center justify-between text-xs text-stone-600">
                                <span>{lot.name}</span>
                                <span>
                                  {(lot.price_cents / 100).toLocaleString('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL',
                                  })}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>

                    {eventMessage ? (
                      <div
                        className={`mb-3 flex items-center gap-1 rounded p-2 text-xs font-bold ${
                          eventMessage.type === 'success'
                            ? 'bg-green-50 text-green-700'
                            : eventMessage.type === 'info'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {eventMessage.type !== 'error' ? <CheckCircle2 size={14} /> : null}
                        {eventMessage.text}
                      </div>
                    ) : null}

                    <div className="mt-auto grid grid-cols-1 gap-2">
                      {!isRegistered ? (
                        <>
                          <button
                            disabled={registerLoading === event.id || isPast}
                            onClick={() => handleRegister(event.id)}
                            className={`w-full rounded-xl py-2.5 font-bold transition-colors ${
                              isPast
                                ? 'cursor-not-allowed bg-stone-100 text-stone-400'
                                : 'bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50'
                            }`}
                          >
                            {registerLoading === event.id ? (
                              <span className="inline-flex items-center gap-2">
                                <Loader2 size={16} className="animate-spin" /> Inscrevendo...
                              </span>
                            ) : isPast ? (
                              'Evento encerrado'
                            ) : (
                              <span className="inline-flex items-center gap-2">
                                <Ticket size={16} /> Fazer inscrição
                              </span>
                            )}
                          </button>
                          {(event.ticket_lots || []).length > 0 ? (
                            <Link
                              href={`/checkout?lotId=${event.ticket_lots?.[0]?.id || ''}`}
                              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-primary-200 bg-primary-50 py-2.5 text-sm font-bold text-primary-700 transition-colors hover:bg-primary-100"
                            >
                              <ShoppingCart size={16} />
                              Comprar via Checkout
                            </Link>
                          ) : null}
                        </>
                      ) : (
                        <button
                          disabled={checkinLoading === event.id || isPast}
                          onClick={() => handleCheckin(event.id)}
                          className={`w-full rounded-xl py-2.5 font-bold transition-colors ${
                            isPast
                              ? 'cursor-not-allowed bg-stone-100 text-stone-400'
                              : 'bg-stone-900 text-white hover:bg-stone-800 disabled:opacity-50'
                          }`}
                        >
                          {checkinLoading === event.id ? (
                            <span className="inline-flex items-center gap-2">
                              <Loader2 size={16} className="animate-spin" /> Processando...
                            </span>
                          ) : isPast ? (
                            'Evento encerrado'
                          ) : (
                            'Realizar check-in'
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
