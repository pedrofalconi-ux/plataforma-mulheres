import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const schemaCache = new Map<string, boolean>();

export type AdminContext = {
  user: { id: string };
  adminClient: any;
};

export async function requireAdmin(): Promise<AdminContext | NextResponse> {
  const cookieStore = await cookies();
  const supabaseSession = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabaseSession.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { data: profile } = await supabaseSession
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role?.toLowerCase() !== 'admin') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
  }

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  return {
    user: { id: user.id },
    adminClient,
  };
}

export async function logAuditEvent({
  adminClient,
  profileId,
  action,
  entityName,
  entityId,
  oldValue,
  newValue,
  request,
}: {
  adminClient: any;
  profileId: string;
  action: string;
  entityName: string;
  entityId?: string | null;
  oldValue?: unknown;
  newValue?: unknown;
  request: Request;
}) {
  try {
    const hasAuditLogs = await tableExists(adminClient, 'audit_logs');
    if (!hasAuditLogs) return;

    await adminClient.from('audit_logs').insert({
      profile_id: profileId,
      action,
      entity_name: entityName,
      entity_id: entityId ?? null,
      old_value: oldValue ?? null,
      new_value: newValue ?? null,
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown',
    });
  } catch (error: any) {
    if (isMissingTableError(error)) return;
    throw error;
  }
}

export function sanitizeHtml(html: string | null | undefined) {
  if (html === undefined) return undefined;
  if (html === null) return null;

  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/<(iframe|object|embed|link|meta)[^>]*>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '')
    .replace(/\sjavascript:/gi, '')
    .trim();
}

export function sanitizeText(text: string | null | undefined) {
  if (text === undefined) return undefined;
  if (text === null) return null;

  return text
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function emptyStringToNull(value: string | null | undefined) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

function isMissingTableError(error: any) {
  const message = String(error?.message || '');
  return error?.code === 'PGRST205' || message.includes("Could not find the table 'public.");
}

function isMissingColumnError(error: any, table: string, column: string) {
  const message = String(error?.message || '');
  return (
    error?.code === '42703' ||
    message.includes(`column ${table}.${column} does not exist`) ||
    message.includes(`Could not find the '${column}' column`)
  );
}

export async function tableExists(adminClient: any, table: string) {
  const cacheKey = `table:${table}`;
  if (schemaCache.has(cacheKey)) return schemaCache.get(cacheKey);

  const { error } = await adminClient.from(table).select('id').limit(1);
  const exists = !error || !isMissingTableError(error);
  schemaCache.set(cacheKey, exists);
  return exists;
}

export async function filterExistingColumns<T extends Record<string, any>>(
  adminClient: any,
  table: string,
  values: T
) {
  const filteredEntries = await Promise.all(
    Object.entries(values).map(async ([column, value]) => {
      const cacheKey = `column:${table}.${column}`;

      if (schemaCache.has(cacheKey)) {
        if (schemaCache.get(cacheKey)) {
          return [column, value];
        }
        // Revalida colunas que antes nao existiam para nao travar depois de migrations aplicadas.
      }

      const { error } = await adminClient.from(table).select(column).limit(1);
      if (error && isMissingColumnError(error, table, column)) {
        schemaCache.delete(cacheKey);
        return null;
      }

      schemaCache.set(cacheKey, true);
      return [column, value];
    })
  );

  return Object.fromEntries(filteredEntries.filter(Boolean) as [string, any][]);
}
