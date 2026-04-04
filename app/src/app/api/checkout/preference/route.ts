import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { createClient, createAdminClient } from '@/lib/supabase/server';

// Inicializa o Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN || '',
});

export async function POST(request: Request) {
  try {
    const { items: requestItems } = await request.json();
    if (!requestItems || !Array.isArray(requestItems) || requestItems.length === 0) {
      return NextResponse.json({ error: 'Nenhum item selecionado' }, { status: 400 });
    }

    const supabase = await createClient();
    const adminSupabase = await createAdminClient();

    // 1. Verificar usuário logado
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // 2. Buscar detalhes dos itens no banco para garantir preços corretos
    const processedItems: any[] = [];
    let totalCents = 0;

    for (const item of requestItems) {
      if (item.type === 'course') {
        const { data: course } = await adminSupabase
          .from('courses')
          .select('id, title, price')
          .eq('id', item.id)
          .single();
        
        if (course) {
          const priceCents = Math.round((Number(course.price) || 0) * 100);
          processedItems.push({
            id: course.id,
            title: course.title,
            type: 'course',
            priceCents,
            price: Number(course.price) || 0,
            quantity: 1
          });
          totalCents += priceCents;
        }
      }
      // Adicionar lógica de ticket_lots futuramente se necessário
    }

    if (processedItems.length === 0) {
      return NextResponse.json({ error: 'Itens inválidos' }, { status: 400 });
    }

    // 3. Criar ordem pai
    const { data: order, error: orderError } = await adminSupabase
      .from('checkout_orders')
      .insert({
        profile_id: user.id,
        total_cents: totalCents,
        status: 'pending'
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // 4. Criar itens da ordem
    const orderItemsToInsert = processedItems.map(item => ({
      order_id: order.id,
      item_type: item.type,
      reference_id: item.id,
      unit_price_cents: item.priceCents,
      quantity: item.quantity
    }));

    const { error: itemsError } = await adminSupabase
      .from('checkout_order_items')
      .insert(orderItemsToInsert);

    if (itemsError) throw itemsError;

    // 5. Criar Preferência no Mercado Pago
    if (!process.env.MP_ACCESS_TOKEN) {
      throw new Error('Ambiente não configurado: MP_ACCESS_TOKEN ausente.');
    }

    const preference = new Preference(client);
    
    const response = await preference.create({
      body: {
        items: processedItems.map(item => ({
          id: item.id,
          title: item.title,
          quantity: item.quantity,
          unit_price: item.price,
          currency_id: 'BRL',
        })),
        external_reference: order.id,
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success`,
          failure: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/failure`,
          pending: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success`,
        },
        auto_return: 'approved',
        notification_url: process.env.MP_WEBHOOK_URL 
          ? `${process.env.MP_WEBHOOK_URL}/api/webhooks/mercadopago`
          : undefined,
      },
    });

    return NextResponse.json({ 
      id: response.id, 
      init_point: response.init_point 
    });

  } catch (error: any) {
    console.error('Erro no Checkout:', error);
    return NextResponse.json({ 
      error: 'Erro interno no servidor', 
      details: error.message || 'Erro desconhecido'
    }, { status: 500 });
  }
}
