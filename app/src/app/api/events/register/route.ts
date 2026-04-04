import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

function generateTicketCode(eventId: string) {
  const random = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, '0');
  return `EVT-${eventId.slice(0, 4).toUpperCase()}-${random}`;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { event_id } = await request.json();
    if (!event_id) {
      return NextResponse.json({ error: 'ID do evento é obrigatório' }, { status: 400 });
    }

    let { data: lot } = await supabase.from('ticket_lots').select('id').eq('event_id', event_id).limit(1).single();

    if (!lot) {
      const { data: newLot, error: lotError } = await supabase
        .from('ticket_lots')
        .insert({
          event_id,
          name: 'Entrada Franca',
          price_cents: 0,
          quantity: 10000,
        })
        .select('id')
        .single();

      if (lotError) throw lotError;
      lot = newLot;
    }

    const { data: existingTicket } = await supabase
      .from('tickets')
      .select('id, code, purchased_at')
      .eq('lot_id', lot.id)
      .eq('profile_id', user.id)
      .limit(1)
      .single();

    if (existingTicket) {
      return NextResponse.json({
        alreadyRegistered: true,
        message: 'Inscrição já realizada para este evento.',
        ticket: existingTicket,
      });
    }

    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .insert({
        lot_id: lot.id,
        profile_id: user.id,
        code: generateTicketCode(event_id),
      })
      .select('id, code, purchased_at')
      .single();

    if (ticketError) throw ticketError;

    return NextResponse.json({
      success: true,
      message: 'Inscrição confirmada com sucesso.',
      ticket,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
