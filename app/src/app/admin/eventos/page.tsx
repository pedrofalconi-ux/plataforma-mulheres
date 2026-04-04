'use client';

import React, { useEffect, useState } from 'react';
import { Calendar, Loader2, Pencil, Plus, Trash2, Video } from 'lucide-react';

type EventItem = {
  id: string;
  title: string;
  description: string | null;
  start_at: string;
  end_at: string | null;
  location: string | null;
  is_online: boolean;
  stream_url: string | null;
  max_attendees: number | null;
};

type EventForm = {
  title: string;
  description: string;
  start_at: string;
  end_at: string;
  location: string;
  is_online: boolean;
  stream_url: string;
  max_attendees: string;
};

const EMPTY_FORM: EventForm = {
  title: '',
  description: '',
  start_at: '',
  end_at: '',
  location: '',
  is_online: true,
  stream_url: '',
  max_attendees: '',
};

function toInputDate(dateString: string | null) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const timezoneOffset = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
}

function toIso(dateString: string) {
  if (!dateString) return null;
  return new Date(dateString).toISOString();
}

export default function AdminEventosPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EventForm>(EMPTY_FORM);

  async function loadEvents() {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/events');
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Falha ao carregar eventos.');
      setEvents(data || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao carregar eventos.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEvents();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (event: EventItem) => {
    setEditingId(event.id);
    setForm({
      title: event.title,
      description: event.description || '',
      start_at: toInputDate(event.start_at),
      end_at: toInputDate(event.end_at),
      location: event.location || '',
      is_online: event.is_online,
      stream_url: event.stream_url || '',
      max_attendees: event.max_attendees ? String(event.max_attendees) : '',
    });
    setShowModal(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        title: form.title,
        description: form.description || null,
        start_at: toIso(form.start_at),
        end_at: toIso(form.end_at),
        location: form.location || null,
        is_online: form.is_online,
        stream_url: form.stream_url || null,
        max_attendees: form.max_attendees ? Number(form.max_attendees) : null,
      };

      const res = await fetch('/api/admin/events', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingId ? { id: editingId, ...payload } : payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Falha ao salvar evento.');

      setShowModal(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      await loadEvents();
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar evento.');
    } finally {
      setSaving(false);
    }
  };

  const removeEvent = async (id: string) => {
    if (!confirm('Deseja remover este evento?')) return;

    try {
      const res = await fetch(`/api/admin/events?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Falha ao excluir evento.');
      await loadEvents();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir evento.');
    }
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-stone-900">Gestão de Eventos</h1>
          <p className="text-stone-500">Organize agenda, inscrições e transmissão.</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 font-bold text-white transition hover:bg-primary-700"
        >
          <Plus size={18} /> Novo evento
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex justify-center p-16 text-stone-400">
            <Loader2 className="animate-spin" size={32} />
          </div>
        ) : error ? (
          <div className="p-6 text-red-700">{error}</div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center p-16 text-center text-stone-500">
            <Calendar size={42} className="mb-3 text-stone-300" />
            Nenhum evento cadastrado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50 text-xs uppercase text-stone-500">
                <tr>
                  <th className="px-6 py-3">Evento</th>
                  <th className="px-6 py-3">Data/Hora</th>
                  <th className="px-6 py-3">Formato</th>
                  <th className="px-6 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {events.map((event) => (
                  <tr key={event.id} className="hover:bg-stone-50">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-stone-900">{event.title}</div>
                      <div className="line-clamp-2 max-w-lg text-xs text-stone-500">{event.description || '-'}</div>
                    </td>
                    <td className="px-6 py-4 text-stone-600">
                      {new Date(event.start_at).toLocaleString('pt-BR')}
                      {event.end_at ? ` - ${new Date(event.end_at).toLocaleTimeString('pt-BR')}` : ''}
                    </td>
                    <td className="px-6 py-4">
                      {event.is_online ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">
                          <Video size={12} /> Online
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">
                          Presencial
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEdit(event)}
                          className="rounded-lg p-2 text-primary-600 transition hover:bg-primary-50"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => removeEvent(event.id)}
                          className="rounded-lg p-2 text-red-600 transition hover:bg-red-50"
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
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={submit} className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="mb-5 font-serif text-xl font-bold text-stone-900">
              {editingId ? 'Editar evento' : 'Novo evento'}
            </h2>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-stone-700">Título</label>
                <input
                  required
                  type="text"
                  value={form.title}
                  onChange={(event) => setForm({ ...form, title: event.target.value })}
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">Início</label>
                <input
                  required
                  type="datetime-local"
                  value={form.start_at}
                  onChange={(event) => setForm({ ...form, start_at: event.target.value })}
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">Fim</label>
                <input
                  type="datetime-local"
                  value={form.end_at}
                  onChange={(event) => setForm({ ...form, end_at: event.target.value })}
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">Formato</label>
                <select
                  value={form.is_online ? 'online' : 'presencial'}
                  onChange={(event) => setForm({ ...form, is_online: event.target.value === 'online' })}
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="online">Online</option>
                  <option value="presencial">Presencial</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">Limite de vagas</label>
                <input
                  type="number"
                  min={0}
                  value={form.max_attendees}
                  onChange={(event) => setForm({ ...form, max_attendees: event.target.value })}
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  {form.is_online ? 'Link da transmissão' : 'Local'}
                </label>
                <input
                  type="text"
                  value={form.is_online ? form.stream_url : form.location}
                  onChange={(event) =>
                    setForm(
                      form.is_online
                        ? { ...form, stream_url: event.target.value }
                        : { ...form, location: event.target.value },
                    )
                  }
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-stone-700">Descrição</label>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-xl border border-stone-300 px-4 py-2 font-semibold text-stone-700 hover:bg-stone-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : null}
                Salvar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
