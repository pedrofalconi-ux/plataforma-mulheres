import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { createAdminClient } from '@/lib/supabase/server';

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN || '',
});

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const data_id = searchParams.get('data.id');

    // Mercado Pago envia notificações de vários tipos. Focamos em 'payment'.
    if (type !== 'payment' || !data_id) {
      return NextResponse.json({ received: true });
    }

    // 1. Buscar detalhes do pagamento no Mercado Pago (Fonte da Verdade)
    const payment = new Payment(client);
    const paymentData = await payment.get({ id: data_id });

    if (!paymentData || !paymentData.external_reference) {
      return NextResponse.json({ error: 'Pagamento não encontrado ou sem referência' }, { status: 400 });
    }

    const orderId = paymentData.external_reference;
    const supabase = await createAdminClient();

    // 2. Se o pagamento foi aprovado, ativar a matrícula
    if (paymentData.status === 'approved') {
      // a. Atualizar o status da ordem
      const { data: order, error: orderError } = await supabase
        .from('checkout_orders')
        .update({ status: 'completed' })
        .eq('id', orderId)
        .select()
        .single();

      if (orderError) throw orderError;

      // b. Buscar os itens da ordem para saber qual curso liberar
      const { data: items, error: itemsError } = await supabase
        .from('checkout_order_items')
        .select('reference_id, item_type')
        .eq('order_id', orderId);

      if (itemsError) throw itemsError;

      // c. Criar a matrícula (enrollment) para cada curso na ordem
      for (const item of items) {
        if (item.item_type === 'course') {
          const { error: enrollmentError } = await supabase
            .from('enrollments')
            .upsert({
              profile_id: order.profile_id,
              course_id: item.reference_id,
              status: 'active',
              enrolled_at: new Date().toISOString()
            }, { 
              onConflict: 'profile_id, course_id' 
            });

          if (enrollmentError) {
            console.error(`Erro ao matricular usuário ${order.profile_id} no curso ${item.reference_id}:`, enrollmentError);
          }
        }
      }

      // d. Limpar o carrinho para os itens comprados
      const purchasedCourseIds = items
        .filter(item => item.item_type === 'course')
        .map(item => item.reference_id);
      
      if (purchasedCourseIds.length > 0) {
        await supabase
          .from('cart_items')
          .delete()
          .eq('profile_id', order.profile_id)
          .in('course_id', purchasedCourseIds);
      }

      console.log(`Pagamento aprovado, cursos liberados e carrinho limpo para Ordem: ${orderId}`);
    } else if (paymentData.status === 'rejected' || paymentData.status === 'cancelled') {
      // Atualizar status para cancelado
      await supabase
        .from('checkout_orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Erro no Webhook Mercado Pago:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
