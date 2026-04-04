import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient, createClient } from '@/lib/supabase/server';

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const CheckoutSchema = z.object({
  courseIds: z.array(z.string().regex(uuidRegex, 'ID de curso inválido')).default([]),
  lots: z
    .array(
      z.object({
        lotId: z.string().regex(uuidRegex, 'ID de lote inválido'),
        quantity: z.number().int().min(1).max(10).default(1),
      }),
    )
    .default([]),
});

function randomCode(prefix: string) {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${Date.now().toString().slice(-6)}-${random}`;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const payload = CheckoutSchema.parse(await request.json());
    if (payload.courseIds.length === 0 && payload.lots.length === 0) {
      return NextResponse.json(
        { error: 'Selecione ao menos um item para finalizar checkout' },
        { status: 400 },
      );
    }

    const adminClient = await createAdminClient();

    const {
      data: profile,
      error: profileError,
    } = await adminClient
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
    }

    const { data: order, error: orderError } = await adminClient
      .from('checkout_orders')
      .insert({
        profile_id: user.id,
        status: 'confirmed',
        total_cents: 0,
      })
      .select()
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: orderError?.message || 'Falha ao criar pedido de checkout' },
        { status: 500 },
      );
    }

    const enrolledCourses: any[] = [];
    const generatedTickets: any[] = [];
    let totalCents = 0;

    for (const courseId of payload.courseIds) {
      const { data: enrollment, error: enrollmentError } = await adminClient
        .from('enrollments')
        .upsert(
          {
            profile_id: user.id,
            course_id: courseId,
            status: 'active',
          },
          { onConflict: 'profile_id,course_id' },
        )
        .select('id, course_id, status, enrolled_at')
        .single();

      if (enrollmentError) throw enrollmentError;

      enrolledCourses.push(enrollment);
      await adminClient.from('checkout_order_items').insert({
        order_id: order.id,
        item_type: 'course',
        reference_id: courseId,
        quantity: 1,
        unit_price_cents: 0,
      });
    }

    for (const lotSelection of payload.lots) {
      const { data: lot, error: lotError } = await adminClient
        .from('ticket_lots')
        .select('id, event_id, name, price_cents, quantity')
        .eq('id', lotSelection.lotId)
        .single();

      if (lotError || !lot) {
        throw new Error(`Lote inválido: ${lotSelection.lotId}`);
      }

      totalCents += (lot.price_cents || 0) * lotSelection.quantity;

      for (let i = 0; i < lotSelection.quantity; i += 1) {
        const { data: ticket, error: ticketError } = await adminClient
          .from('tickets')
          .insert({
            lot_id: lot.id,
            profile_id: user.id,
            code: randomCode('EVT'),
          })
          .select('id, lot_id, code, purchased_at')
          .single();

        if (ticketError) throw ticketError;
        generatedTickets.push(ticket);
      }

      await adminClient.from('checkout_order_items').insert({
        order_id: order.id,
        item_type: 'event_ticket',
        reference_id: lot.id,
        quantity: lotSelection.quantity,
        unit_price_cents: lot.price_cents || 0,
      });
    }

    const { data: updatedOrder } = await adminClient
      .from('checkout_orders')
      .update({ total_cents: totalCents, status: 'confirmed' })
      .eq('id', order.id)
      .select()
      .single();

    if (payload.courseIds.length > 0) {
      await adminClient
        .from('cart_items')
        .delete()
        .eq('profile_id', user.id)
        .in('course_id', payload.courseIds);
    }

    return NextResponse.json({
      success: true,
      order: updatedOrder || order,
      enrollments: enrolledCourses,
      tickets: generatedTickets,
      message: 'Checkout concluído com sucesso.',
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos para checkout', details: error.flatten() },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: error?.message || 'Falha no checkout' },
      { status: 500 },
    );
  }
}
