import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { createAdminClient, createClient } from '@/lib/supabase/server';

type TalentRow = {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  papel: string;
  regiao: string;
  estado: string;
  habilidades: string;
  cadastro: string;
};

function escapeCsv(value: unknown) {
  const str = String(value ?? '');
  return `"${str.replace(/"/g, '""')}"`;
}

function buildCsv(rows: TalentRow[]) {
  const header = [
    'ID',
    'Nome',
    'E-mail',
    'Telefone',
    'Papel',
    'Região',
    'Estado',
    'Habilidades',
    'Data de Cadastro',
  ];
  const lines = rows.map((row) =>
    [
      row.id,
      row.nome,
      row.email,
      row.telefone,
      row.papel,
      row.regiao,
      row.estado,
      row.habilidades,
      row.cadastro,
    ]
      .map(escapeCsv)
      .join(','),
  );
  return [header.join(','), ...lines].join('\n');
}

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: 'Não autorizado' }, { status: 401 }) };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role?.toLowerCase() !== 'admin') {
    return { error: NextResponse.json({ error: 'Acesso negado' }, { status: 403 }) };
  }

  return { user };
}

function normalizeDate(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('pt-BR');
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const url = new URL(request.url);
    const q = url.searchParams.get('q')?.trim() || '';
    const regionId = url.searchParams.get('regionId') || '';
    const skillId = url.searchParams.get('skillId') || '';
    const format = url.searchParams.get('format') || 'json';

    const adminClient = await createAdminClient();

    let query = adminClient
      .from('profiles')
      .select(
        `
          id,
          full_name,
          email,
          phone,
          role,
          created_at,
          region_id,
          regions(name, state),
          profile_skills(skill_id, skills(id, name))
        `,
      )
      .neq('role', 'guest')
      .order('full_name', { ascending: true });

    if (regionId) {
      query = query.eq('region_id', regionId);
    }

    if (q) {
      const safeQ = q.replace(/,/g, '');
      query = query.or(`full_name.ilike.%${safeQ}%,email.ilike.%${safeQ}%,phone.ilike.%${safeQ}%`);
    }

    const { data: profiles, error } = await query;
    if (error) throw error;

    const filteredProfiles = (profiles || []).filter((profile: any) => {
      if (!skillId) return true;
      return (profile.profile_skills || []).some((ps: any) => ps.skill_id === skillId);
    });

    const rows: TalentRow[] = filteredProfiles.map((profile: any) => {
      const skillNames = (profile.profile_skills || [])
        .map((ps: any) => ps.skills?.name)
        .filter(Boolean)
        .sort((a: string, b: string) => a.localeCompare(b, 'pt-BR'));

      return {
        id: profile.id,
        nome: profile.full_name || '-',
        email: profile.email || '-',
        telefone: profile.phone || '-',
        papel: profile.role || '-',
        regiao: profile.regions?.name || '-',
        estado: profile.regions?.state || '-',
        habilidades: skillNames.join(', ') || '-',
        cadastro: normalizeDate(profile.created_at),
      };
    });

    if (format === 'csv') {
      const csv = buildCsv(rows);
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="banco-de-talentos.csv"',
        },
      });
    }

    if (format === 'xlsx') {
      const worksheet = XLSX.utils.json_to_sheet(
        rows.map((row) => ({
          ID: row.id,
          Nome: row.nome,
          'E-mail': row.email,
          Telefone: row.telefone,
          Papel: row.papel,
          Região: row.regiao,
          Estado: row.estado,
          Habilidades: row.habilidades,
          'Data de Cadastro': row.cadastro,
        })),
      );
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Talentos');
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type':
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': 'attachment; filename="banco-de-talentos.xlsx"',
        },
      });
    }

    const [{ data: regions }, { data: skills }] = await Promise.all([
      adminClient.from('regions').select('id, name, state').order('name', { ascending: true }),
      adminClient.from('skills').select('id, name').order('name', { ascending: true }),
    ]);

    return NextResponse.json({
      rows,
      filters: {
        q,
        regionId,
        skillId,
      },
      options: {
        regions: regions || [],
        skills: skills || [],
      },
      count: rows.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Falha ao consultar Banco de Talentos' },
      { status: 500 },
    );
  }
}
