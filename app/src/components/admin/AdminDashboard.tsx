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

type DashboardStats = {
  totalUsuarios: number;
  matriculasAtivas: number;
  faturamentoTotal: number;
  vendasNoMes: number;
};

type ChartRow = {
  name: string;
  usuarios: number;
  faturamento: number;
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

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsuarios: 0,
    matriculasAtivas: 0,
    faturamentoTotal: 0,
    vendasNoMes: 0,
  });
  const [chartData, setChartData] = useState<ChartRow[]>([]);
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      setError('');

      try {
        const response = await fetch('/api/admin/dashboard', {
          method: 'GET',
          cache: 'no-store',
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.error || 'Nao foi possivel carregar o painel.');
        }

        setStats(data.stats);
        setChartData(data.chartData || []);
        setRecentSales(data.recentSales || []);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Nao foi possivel carregar o painel.');
      } finally {
        setLoading(false);
      }
    }

    void loadDashboard();
  }, []);

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
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip
                      formatter={(value) => [`R$ ${Number(value || 0).toFixed(2)}`, 'Faturamento']}
                      cursor={{ fill: 'transparent' }}
                    />
                    <Bar dataKey="faturamento" fill="#7f432d" radius={[4, 4, 0, 0]} />
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
