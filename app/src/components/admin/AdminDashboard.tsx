'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from 'recharts';
import { AlertCircle, BookOpen, Loader2, MapPin, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type DashboardStats = {
  totalUsuarios: number;
  matriculasAtivas: number;
  projetosAprovados: number;
  faturamentoTotal: number;
  vendasNoMes: number;
};

type SalesRow = {
  name: string;
  value: number;
};

type ChartRow = {
  name: string;
  usuarios: number;
  conclusoes: number;
};

type RecentSale = {
  id: string;
  total_cents: number;
  created_at: string;
  profiles: { full_name: string; display_name: string | null } | null;
};

function normalizeProfileJoin(
  value: { full_name?: string; display_name?: string | null } | { full_name?: string; display_name?: string | null }[] | null,
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

function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-stone-100 bg-white p-5 shadow-sm sm:p-6">
      <div className={`rounded-2xl p-3 ${color}`}>
        <Icon size={24} className="text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-stone-500">{title}</p>
        <p className="break-words text-xl font-bold text-stone-800 sm:text-2xl">{value}</p>
      </div>
    </div>
  );
}

function buildLastSixMonthsSeries(
  profileDates: string[],
  completedEnrollmentsDates: string[],
): ChartRow[] {
  const now = new Date();
  const months: Array<{ key: string; label: string }> = [];

  for (let index = 5; index >= 0; index -= 1) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - index, 1);
    const key = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
    const label = monthDate.toLocaleDateString('pt-BR', { month: 'short' });
    months.push({ key, label });
  }

  const usersCountByMonth = new Map<string, number>();
  const completionsCountByMonth = new Map<string, number>();

  months.forEach((month) => {
    usersCountByMonth.set(month.key, 0);
    completionsCountByMonth.set(month.key, 0);
  });

  profileDates.forEach((date) => {
    const parsed = new Date(date);
    const key = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}`;
    if (usersCountByMonth.has(key)) {
      usersCountByMonth.set(key, (usersCountByMonth.get(key) || 0) + 1);
    }
  });

  completedEnrollmentsDates.forEach((date) => {
    const parsed = new Date(date);
    const key = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}`;
    if (completionsCountByMonth.has(key)) {
      completionsCountByMonth.set(key, (completionsCountByMonth.get(key) || 0) + 1);
    }
  });

  return months.map((month) => ({
    name: month.label,
    usuarios: usersCountByMonth.get(month.key) || 0,
    conclusoes: completionsCountByMonth.get(month.key) || 0,
  }));
}

export default function AdminDashboard() {
  const supabase = createClient();

  const [stats, setStats] = useState<DashboardStats>({
    totalUsuarios: 0,
    matriculasAtivas: 0,
    projetosAprovados: 0,
    faturamentoTotal: 0,
    vendasNoMes: 0,
  });
  const [chartData, setChartData] = useState<ChartRow[]>([]);
  const [salesData, setSalesData] = useState<SalesRow[]>([]);
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      setError('');

      try {
        const [
          usersCountRes,
          activeEnrollmentsRes,
          approvedProjectsRes,
          profileRowsRes,
          completedRowsRes,
          ordersRes,
        ] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('enrollments').select('*', { count: 'exact', head: true }).eq('status', 'active'),
          supabase.from('observatory_projects').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
          supabase.from('profiles').select('created_at').order('created_at', { ascending: false }),
          supabase.from('enrollments').select('completed_at').eq('status', 'completed').not('completed_at', 'is', null),
          supabase
            .from('checkout_orders')
            .select('id, total_cents, created_at, status, profiles:profile_id (full_name, display_name)')
            .in('status', ['confirmed', 'completed', 'paid'])
            .order('created_at', { ascending: false }),
        ]);

        if (usersCountRes.error) throw usersCountRes.error;
        if (activeEnrollmentsRes.error) throw activeEnrollmentsRes.error;
        if (approvedProjectsRes.error) throw approvedProjectsRes.error;
        if (profileRowsRes.error) throw profileRowsRes.error;
        if (completedRowsRes.error) throw completedRowsRes.error;
        if (ordersRes.error) throw ordersRes.error;

        const allOrders = ordersRes.data || [];
        const totalRevenue = allOrders.reduce((acc, curr) => acc + (curr.total_cents || 0), 0);

        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const ordersThisMonth = allOrders.filter((order) => new Date(order.created_at) >= firstDayOfMonth);

        setStats({
          totalUsuarios: usersCountRes.count || 0,
          matriculasAtivas: activeEnrollmentsRes.count || 0,
          projetosAprovados: approvedProjectsRes.count || 0,
          faturamentoTotal: totalRevenue / 100,
          vendasNoMes: ordersThisMonth.length,
        });

        setRecentSales(
          allOrders.slice(0, 5).map((order) => ({
            id: order.id,
            total_cents: order.total_cents || 0,
            created_at: order.created_at,
            profiles: normalizeProfileJoin(order.profiles as any),
          })),
        );

        const monthlySales = new Map<string, number>();
        for (let index = 5; index >= 0; index -= 1) {
          const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
          const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          monthlySales.set(key, 0);
        }

        allOrders.forEach((order) => {
          const date = new Date(order.created_at);
          const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          if (monthlySales.has(key)) {
            monthlySales.set(key, (monthlySales.get(key) || 0) + order.total_cents / 100);
          }
        });

        const salesChart = Array.from(monthlySales.entries()).map(([key, value]) => {
          const [year, month] = key.split('-');
          const label = new Date(parseInt(year, 10), parseInt(month, 10) - 1).toLocaleDateString('pt-BR', {
            month: 'short',
          });

          return { name: label, value };
        });
        setSalesData(salesChart);

        const profileDates = (profileRowsRes.data || [])
          .map((row) => row.created_at)
          .filter((value): value is string => Boolean(value));

        const completedDates = (completedRowsRes.data || [])
          .map((row) => row.completed_at)
          .filter((value): value is string => Boolean(value));

        setChartData(buildLastSixMonthsSeries(profileDates, completedDates));
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Nao foi possivel carregar o painel.');
      } finally {
        setLoading(false);
      }
    }

    void loadDashboard();
  }, [supabase]);

  return (
    <div className="mx-auto max-w-7xl py-2 sm:py-4">
      <div className="mb-6 sm:mb-8">
        <h1 className="font-serif text-2xl font-bold text-stone-900 sm:text-3xl">Painel Administrativo</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-500 sm:text-base">
          Acompanhe crescimento, faturamento e atividade recente com leitura mais confortavel em telas pequenas.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-stone-400">
          <Loader2 size={36} className="animate-spin" />
        </div>
      ) : error ? (
        <div className="mb-8 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>
      ) : (
        <>
          <div className="mb-8 grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total de usuarios" value={String(stats.totalUsuarios)} icon={Users} color="bg-blue-500" />
            <StatCard
              title="Matriculas ativas"
              value={String(stats.matriculasAtivas)}
              icon={BookOpen}
              color="bg-green-500"
            />
            <StatCard
              title="Faturamento Total"
              value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.faturamentoTotal)}
              icon={MapPin}
              color="bg-primary-500"
            />
            <StatCard
              title="Vendas no Mes"
              value={String(stats.vendasNoMes)}
              icon={AlertCircle}
              color="bg-amber-500"
            />
          </div>

          <div className="mb-8 grid gap-4 sm:gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-stone-100 bg-white p-4 shadow-sm sm:p-6">
              <h3 className="mb-4 text-lg font-bold text-stone-800">Crescimento de Usuarios</h3>
              <div className="h-56 sm:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="usuarios" stroke="#c57f46" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-stone-100 bg-white p-4 shadow-sm sm:p-6">
              <h3 className="mb-4 text-lg font-bold text-stone-800">Faturamento Mensal (R$)</h3>
              <div className="h-56 sm:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesData}>
                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip
                      formatter={(value) => [`R$ ${Number(value || 0).toFixed(2)}`, 'Faturamento']}
                      cursor={{ fill: 'transparent' }}
                    />
                    <Bar dataKey="value" fill="#7f432d" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-stone-100 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-stone-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <h3 className="text-lg font-bold text-stone-800">Vendas Recentes</h3>
              <Link href="/admin/cursos" className="text-sm font-medium text-primary-600 hover:underline">
                Gerenciar Cursos
              </Link>
            </div>

            {recentSales.length === 0 ? (
              <div className="p-6 text-sm text-stone-500">Nenhuma venda registrada ainda.</div>
            ) : (
              <>
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-stone-50 text-xs uppercase text-stone-500">
                      <tr>
                        <th className="px-6 py-3">Aluno</th>
                        <th className="px-6 py-3">Valor</th>
                        <th className="px-6 py-3">Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentSales.map((sale) => (
                        <tr key={sale.id} className="border-b hover:bg-stone-50">
                          <td className="px-6 py-4 font-medium text-stone-900">
                            {sale.profiles?.display_name || sale.profiles?.full_name || 'Usuario'}
                          </td>
                          <td className="px-6 py-4 font-bold text-stone-600">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sale.total_cents / 100)}
                          </td>
                          <td className="px-6 py-4 text-stone-600">
                            {new Date(sale.created_at).toLocaleDateString('pt-BR')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="grid gap-3 p-4 md:hidden">
                  {recentSales.map((sale) => (
                    <article key={sale.id} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h4 className="truncate font-semibold text-stone-900">
                            {sale.profiles?.display_name || sale.profiles?.full_name || 'Usuario'}
                          </h4>
                          <p className="mt-1 text-xs text-stone-500">
                            {new Date(sale.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-primary-700">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sale.total_cents / 100)}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
