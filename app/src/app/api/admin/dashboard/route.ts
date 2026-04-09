import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-api';

type RecentSale = {
  id: string;
  total_cents: number;
  created_at: string;
  profiles: {
    full_name: string;
    display_name: string | null;
  } | null;
  payment_method_id?: string | null;
  source?: 'mercado_pago' | 'local';
};

type DashboardChartRow = {
  name: string;
  usuarios: number;
  faturamento: number;
};

type MercadoPagoPayment = {
  id: number;
  status: string;
  status_detail?: string | null;
  date_created: string;
  date_approved?: string | null;
  payment_method_id?: string | null;
  transaction_amount?: number | null;
  transaction_amount_refunded?: number | null;
  payer?: {
    email?: string | null;
    first_name?: string | null;
    last_name?: string | null;
  } | null;
};

function normalizeProfileJoin(
  value:
    | { full_name?: string; display_name?: string | null }
    | { full_name?: string; display_name?: string | null }[]
    | null,
) {
  if (Array.isArray(value)) {
    return value[0]
      ? {
          full_name: value[0].full_name || '',
          display_name: value[0].display_name ?? null,
        }
      : null;
  }

  if (!value) return null;

  return {
    full_name: value.full_name || '',
    display_name: value.display_name ?? null,
  };
}

function buildLastSixMonthsSalesAndUsers(
  profileDates: string[],
  paidOrders: Array<{ created_at: string; total_cents: number | null }>,
): DashboardChartRow[] {
  const now = new Date();
  const months: Array<{ key: string; label: string }> = [];

  for (let index = 5; index >= 0; index -= 1) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - index, 1);
    const key = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
    const label = monthDate.toLocaleDateString('pt-BR', { month: 'short' });
    months.push({ key, label });
  }

  const usersByMonth = new Map<string, number>();
  const salesByMonth = new Map<string, number>();

  months.forEach((month) => {
    usersByMonth.set(month.key, 0);
    salesByMonth.set(month.key, 0);
  });

  profileDates.forEach((date) => {
    const parsed = new Date(date);
    const key = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}`;
    if (usersByMonth.has(key)) {
      usersByMonth.set(key, (usersByMonth.get(key) || 0) + 1);
    }
  });

  paidOrders.forEach((order) => {
    const parsed = new Date(order.created_at);
    const key = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}`;
    if (salesByMonth.has(key)) {
      salesByMonth.set(key, (salesByMonth.get(key) || 0) + (order.total_cents || 0) / 100);
    }
  });

  return months.map((month) => ({
    name: month.label,
    usuarios: usersByMonth.get(month.key) || 0,
    faturamento: salesByMonth.get(month.key) || 0,
  }));
}

async function fetchMercadoPagoApprovedPayments() {
  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) {
    return [];
  }

  const limit = 100;
  let offset = 0;
  let page = 0;
  const maxPages = 10;
  const results: MercadoPagoPayment[] = [];

  while (page < maxPages) {
    const params = new URLSearchParams({
      status: 'approved',
      sort: 'date_created',
      criteria: 'desc',
      limit: String(limit),
      offset: String(offset),
    });

    const response = await fetch(`https://api.mercadopago.com/v1/payments/search?${params.toString()}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Mercado Pago respondeu com status ${response.status} ao consultar pagamentos.`);
    }

    const payload = await response.json();
    const payments = Array.isArray(payload?.results) ? (payload.results as MercadoPagoPayment[]) : [];
    results.push(...payments);

    if (payments.length < limit) {
      break;
    }

    offset += limit;
    page += 1;
  }

  return results;
}

function getMercadoPagoPayerName(payment: MercadoPagoPayment) {
  const firstName = String(payment.payer?.first_name || '').trim();
  const lastName = String(payment.payer?.last_name || '').trim();
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();

  return fullName || String(payment.payer?.email || '').trim() || 'Cliente Mercado Pago';
}

function mapMercadoPagoPaymentsToRecentSales(payments: MercadoPagoPayment[]): RecentSale[] {
  return payments.slice(0, 8).map((payment) => ({
    id: String(payment.id),
    total_cents: Math.round(
      Math.max(0, Number(payment.transaction_amount || 0) - Number(payment.transaction_amount_refunded || 0)) * 100,
    ),
    created_at: payment.date_approved || payment.date_created,
    payment_method_id: payment.payment_method_id || null,
    source: 'mercado_pago',
    profiles: {
      full_name: getMercadoPagoPayerName(payment),
      display_name: null,
    },
  }));
}

export async function GET() {
  try {
    const adminContext = await requireAdmin();
    if (adminContext instanceof NextResponse) return adminContext;

    const paidStatuses = ['completed', 'paid'];

    const [
      usersCountRes,
      activeEnrollmentsRes,
      profilesRes,
      paidOrdersRes,
    ] = await Promise.all([
      adminContext.adminClient.from('profiles').select('id', { count: 'exact', head: true }),
      adminContext.adminClient
        .from('enrollments')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active'),
      adminContext.adminClient.from('profiles').select('created_at').order('created_at', { ascending: false }),
      adminContext.adminClient
        .from('checkout_orders')
        .select('id, total_cents, created_at, status, profiles:profile_id (full_name, display_name)')
        .in('status', paidStatuses)
        .order('created_at', { ascending: false }),
    ]);

    if (usersCountRes.error) throw usersCountRes.error;
    if (activeEnrollmentsRes.error) throw activeEnrollmentsRes.error;
    if (profilesRes.error) throw profilesRes.error;
    if (paidOrdersRes.error) throw paidOrdersRes.error;

    const paidOrders = paidOrdersRes.data || [];
    const localTotalRevenue = paidOrders.reduce(
      (acc: number, order: { total_cents: number | null }) => acc + (order.total_cents || 0),
      0,
    );

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const localSalesThisMonth = paidOrders.filter(
      (order: { created_at: string }) => new Date(order.created_at) >= firstDayOfMonth,
    );

    const profileDates = (profilesRes.data || [])
      .map((row: { created_at: string | null }) => row.created_at)
      .filter((value: string | null): value is string => Boolean(value));

    const localChartData = buildLastSixMonthsSalesAndUsers(
      profileDates,
      paidOrders.map((order: { created_at: string; total_cents: number | null }) => ({
        created_at: order.created_at,
        total_cents: order.total_cents,
      })),
    );

    const localRecentSales: RecentSale[] = paidOrders.slice(0, 8).map(
      (order: {
        id: string;
        total_cents: number | null;
        created_at: string;
        profiles:
          | { full_name?: string; display_name?: string | null }
          | { full_name?: string; display_name?: string | null }[]
          | null;
      }) => ({
        id: order.id,
        total_cents: order.total_cents || 0,
        created_at: order.created_at,
        profiles: normalizeProfileJoin(order.profiles),
        source: 'local',
      }),
    );

    let stats = {
      totalUsuarios: usersCountRes.count || 0,
      matriculasAtivas: activeEnrollmentsRes.count || 0,
      faturamentoTotal: localTotalRevenue / 100,
      vendasNoMes: localSalesThisMonth.length,
    };
    let chartData = localChartData;
    let recentSales = localRecentSales;

    try {
      const mercadoPagoPayments = await fetchMercadoPagoApprovedPayments();

      if (mercadoPagoPayments.length > 0) {
        const mpTotalRevenue = mercadoPagoPayments.reduce(
          (acc, payment) =>
            acc + Math.max(0, Number(payment.transaction_amount || 0) - Number(payment.transaction_amount_refunded || 0)),
          0,
        );

        const mpSalesThisMonth = mercadoPagoPayments.filter((payment) => {
          const date = new Date(payment.date_approved || payment.date_created);
          return date >= firstDayOfMonth;
        });

        stats = {
          totalUsuarios: usersCountRes.count || 0,
          matriculasAtivas: activeEnrollmentsRes.count || 0,
          faturamentoTotal: mpTotalRevenue,
          vendasNoMes: mpSalesThisMonth.length,
        };

        chartData = buildLastSixMonthsSalesAndUsers(
          profileDates,
          mercadoPagoPayments.map((payment) => ({
            created_at: payment.date_approved || payment.date_created,
            total_cents: Math.round(
              Math.max(0, Number(payment.transaction_amount || 0) - Number(payment.transaction_amount_refunded || 0)) *
                100,
            ),
          })),
        );

        recentSales = mapMercadoPagoPaymentsToRecentSales(mercadoPagoPayments);
      }
    } catch (mercadoPagoError) {
      console.error('[ADMIN_DASHBOARD_MP_SYNC]', mercadoPagoError);
    }

    return NextResponse.json({
      stats,
      chartData,
      recentSales,
    });
  } catch (error: any) {
    console.error('[ADMIN_DASHBOARD_GET]', error);
    return NextResponse.json(
      { error: error?.message || 'Não foi possível carregar o painel.' },
      { status: 500 },
    );
  }
}
