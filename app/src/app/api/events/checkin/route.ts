import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

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

    const { data: lots, error: lotsError } = await supabase.from('ticket_lots').select('id').eq('event_id', event_id);
    if (lotsError) throw lotsError;

    if (!lots || lots.length === 0) {
      return NextResponse.json({ error: 'Você ainda não está inscrito neste evento.' }, { status: 403 });
    }

    const lotIds = lots.map((lot) => lot.id);
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('id')
      .eq('profile_id', user.id)
      .in('lot_id', lotIds)
      .limit(1)
      .single();

    if (ticketError || !ticket) {
      return NextResponse.json({ error: 'Você ainda não está inscrito neste evento.' }, { status: 403 });
    }

    const { data: existingCheckin } = await supabase
      .from('checkins')
      .select('id')
      .eq('ticket_id', ticket.id)
      .limit(1)
      .single();

    if (existingCheckin) {
      return NextResponse.json({ message: 'Check-in já realizado anteriormente.', alreadyCheckedIn: true });
    }

    const { error: checkinError } = await supabase.from('checkins').insert({ ticket_id: ticket.id });
    if (checkinError) throw checkinError;

    return NextResponse.json({ success: true, message: 'Check-in realizado com sucesso.' });
  } catch (error: any) {
    console.error('Erro no check-in de evento:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
