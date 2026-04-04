import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

type EventWithLots = {
  id: string;
  title: string;
  description: string | null;
  start_at: string;
  end_at: string | null;
  location: string | null;
  is_online: boolean;
  stream_url: string | null;
  max_attendees: number | null;
  created_by: string | null;
  created_at: string;
  ticket_lots?: Array<{
    id: string;
    event_id: string;
    name: string;
    price_cents: number;
    quantity: number;
    available_from: string | null;
    available_until: string | null;
  }>;
  is_registered?: boolean;
};

export async function GET(request: Request) {
  try {
    const includeLots = new URL(request.url).searchParams.get('includeLots') === 'true';
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const selectColumns = includeLots
      ? `*,
         ticket_lots (
           id,
           event_id,
           name,
           price_cents,
           quantity,
           available_from,
           available_until
         )`
      : '*';

    const { data: events, error } = await supabase
      .from('events')
      .select(selectColumns)
      .order('start_at', { ascending: true })
      .limit(50);

    if (error) throw error;

    const normalizedEvents: EventWithLots[] = (events || []).map((event: any) => ({
      ...event,
      is_registered: false,
    }));

    if (!user || normalizedEvents.length === 0) {
      return NextResponse.json(normalizedEvents);
    }

    const allLotsFromPayload = normalizedEvents.flatMap((event) => event.ticket_lots || []);
    let lotIds = allLotsFromPayload.map((lot) => lot.id);
    let lotToEvent = new Map(allLotsFromPayload.map((lot) => [lot.id, lot.event_id]));

    if (lotIds.length === 0) {
      const eventIds = normalizedEvents.map((event) => event.id);
      if (eventIds.length > 0) {
        const { data: lots } = await supabase
          .from('ticket_lots')
          .select('id, event_id')
          .in('event_id', eventIds);
        lotIds = (lots || []).map((lot) => lot.id);
        lotToEvent = new Map((lots || []).map((lot) => [lot.id, lot.event_id]));
      }
    }

    if (lotIds.length === 0) {
      return NextResponse.json(normalizedEvents);
    }

    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('lot_id')
      .eq('profile_id', user.id)
      .in('lot_id', lotIds);

    if (ticketsError) throw ticketsError;

    const registeredEvents = new Set(
      (tickets || []).map((ticket) => lotToEvent.get(ticket.lot_id)).filter((value): value is string => Boolean(value)),
    );

    const result = normalizedEvents.map((event) => ({
      ...event,
      is_registered: registeredEvents.has(event.id),
    }));

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
