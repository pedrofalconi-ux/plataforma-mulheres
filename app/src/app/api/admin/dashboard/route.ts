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
};

type DashboardChartRow = {
  name: string;
  usuarios: number;
  faturamento: number;
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
    const totalRevenue = paidOrders.reduce(
      (acc: number, order: { total_cents: number | null }) => acc + (order.total_cents || 0),
      0,
    );

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const salesThisMonth = paidOrders.filter(
      (order: { created_at: string }) => new Date(order.created_at) >= firstDayOfMonth,
    );

    const profileDates = (profilesRes.data || [])
      .map((row: { created_at: string | null }) => row.created_at)
      .filter((value: string | null): value is string => Boolean(value));

    const chartData = buildLastSixMonthsSalesAndUsers(
      profileDates,
      paidOrders.map((order: { created_at: string; total_cents: number | null }) => ({
        created_at: order.created_at,
        total_cents: order.total_cents,
      })),
    );

    const recentSales: RecentSale[] = paidOrders.slice(0, 8).map(
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
      }),
    );

    return NextResponse.json({
      stats: {
        totalUsuarios: usersCountRes.count || 0,
        matriculasAtivas: activeEnrollmentsRes.count || 0,
        faturamentoTotal: totalRevenue / 100,
        vendasNoMes: salesThisMonth.length,
      },
      chartData,
      recentSales,
    });
  } catch (error: any) {
    console.error('[ADMIN_DASHBOARD_GET]', error);
    return NextResponse.json(
      { error: error?.message || 'Nao foi possivel carregar o painel.' },
      { status: 500 },
    );
  }
}
