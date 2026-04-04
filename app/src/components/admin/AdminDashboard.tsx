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
    <div className="flex items-center space-x-4 rounded-xl border border-stone-100 bg-white p-6 shadow-sm">
      <div className={`rounded-full p-3 ${color}`}>
        <Icon size={24} className="text-white" />
      </div>
      <div>
        <p className="text-sm font-medium text-stone-500">{title}</p>
        <p className="text-2xl font-bold text-stone-800">{value}</p>
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
          ordersRes
        ] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('enrollments').select('*', { count: 'exact', head: true }).eq('status', 'active'),
          supabase.from('observatory_projects').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
          supabase.from('profiles').select('created_at').order('created_at', { ascending: false }),
          supabase.from('enrollments').select('completed_at').eq('status', 'completed').not('completed_at', 'is', null),
          supabase.from('checkout_orders')
            .select('id, total_cents, created_at, status, profiles:profile_id (full_name, display_name)')
            .in('status', ['confirmed', 'completed', 'paid'])
            .order('created_at', { ascending: false })
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
        const ordersThisMonth = allOrders.filter(o => new Date(o.created_at) >= firstDayOfMonth);

        setStats({
          totalUsuarios: usersCountRes.count || 0,
          matriculasAtivas: activeEnrollmentsRes.count || 0,
          projetosAprovados: approvedProjectsRes.count || 0,
          faturamentoTotal: totalRevenue / 100,
          vendasNoMes: ordersThisMonth.length,
        });

        setRecentSales(allOrders.slice(0, 5) as any);

        // Processar Faturamento Mensal
        const monthlySales = new Map<string, number>();
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          monthlySales.set(key, 0);
        }

        allOrders.forEach(order => {
          const d = new Date(order.created_at);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          if (monthlySales.has(key)) {
            monthlySales.set(key, (monthlySales.get(key) || 0) + (order.total_cents / 100));
          }
        });

        const salesChart = Array.from(monthlySales.entries()).map(([key, value]) => {
          const [yr, mo] = key.split('-');
          const label = new Date(parseInt(yr), parseInt(mo) - 1).toLocaleDateString('pt-BR', { month: 'short' });
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
        setError(err.message || 'Não foi possível carregar o painel.');
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [supabase]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-8 font-serif text-2xl font-bold text-stone-900">Painel Administrativo</h1>

      {loading ? (
        <div className="flex justify-center py-16 text-stone-400">
          <Loader2 size={36} className="animate-spin" />
        </div>
      ) : error ? (
        <div className="mb-8 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>
      ) : (
        <>
          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total de usuários" value={String(stats.totalUsuarios)} icon={Users} color="bg-blue-500" />
            <StatCard
              title="Matrículas ativas"
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
              title="Vendas (Mês)"
              value={String(stats.vendasNoMes)}
              icon={AlertCircle}
              color="bg-amber-500"
            />
          </div>

          <div className="mb-8 grid gap-8 lg:grid-cols-2">
            <div className="rounded-xl border border-stone-100 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-bold text-stone-800">Crescimento de Usuários</h3>
              <div className="h-64">
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

            <div className="rounded-xl border border-stone-100 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-bold text-stone-800">Faturamento Mensal (R$)</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesData}>
                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip 
                      formatter={(value: any) => [`R$ ${Number(value || 0).toFixed(2)}`, 'Faturamento']}
                      cursor={{ fill: 'transparent' }} 
                    />
                    <Bar dataKey="value" fill="#7f432d" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-stone-100 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-stone-100 p-6">
              <h3 className="text-lg font-bold text-stone-800">Vendas Recentes</h3>
              <Link href="/admin/cursos" className="text-sm font-medium text-primary-600 hover:underline">
                Gerenciar Cursos
              </Link>
            </div>

            {recentSales.length === 0 ? (
              <div className="p-6 text-sm text-stone-500">Nenhuma venda registrada ainda.</div>
            ) : (
              <div className="overflow-x-auto">
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
                          {sale.profiles?.display_name || sale.profiles?.full_name || 'Usuário'}
                        </td>
                        <td className="px-6 py-4 text-stone-600 font-bold">
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
            )}
          </div>
        </>
      )}
    </div>
  );
}
