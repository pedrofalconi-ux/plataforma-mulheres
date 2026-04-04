/**
 * Testes de SQL Injection
 * 
 * Valida que as rotas de API protegem contra vetores comuns de SQL Injection.
 * Testa payloads maliciosos nos endpoints que recebem input do usuário.
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

const SQL_INJECTION_PAYLOADS = [
  "' OR '1'='1",
  "'; DROP TABLE users; --",
  "1; SELECT * FROM profiles --",
  "' UNION SELECT * FROM profiles --",
  "admin'--",
  "1' OR '1'='1' /*",
  "'; EXEC xp_cmdshell('whoami'); --",
  "' AND 1=CONVERT(int, @@version) --",
  "1 AND (SELECT COUNT(*) FROM profiles) > 0 --",
  "' OR EXISTS(SELECT * FROM profiles WHERE role='admin') --",
];

async function fetchAPI(path: string, options?: RequestInit) {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
    });
    return { status: res.status, body: await res.text() };
  } catch (err: any) {
    return { status: 0, body: err.message };
  }
}

describe('🛡️ Testes de SQL Injection', () => {

  describe('API /api/courses', () => {
    it.each(SQL_INJECTION_PAYLOADS)(
      'deve rejeitar payload SQL no campo de busca: "%s"',
      async (payload) => {
        const result = await fetchAPI(`/api/courses?search=${encodeURIComponent(payload)}`);
        // O Supabase não deve expor erro de SQL — espera-se 200 com array vazio ou 400/500 sem detalhes de SQL
        expect(result.body).not.toContain('syntax error');
        expect(result.body).not.toContain('pg_catalog');
        expect(result.body).not.toContain('relation "');
        expect(result.body).not.toContain('column "');
      }
    );
  });

  describe('API /api/forum', () => {
    it.each(SQL_INJECTION_PAYLOADS)(
      'deve rejeitar payload SQL no corpo da criação de tópico: "%s"',
      async (payload) => {
        const result = await fetchAPI('/api/forum', {
          method: 'POST',
          body: JSON.stringify({ title: payload, content: payload }),
        });
        // Sem auth deve ser 401; com auth o Supabase sanitiza 
        expect([401, 400, 403, 500, 200]).toContain(result.status);
        expect(result.body).not.toContain('syntax error');
        expect(result.body).not.toContain('pg_catalog');
      }
    );
  });

  describe('API /api/blog', () => {
    it.each(SQL_INJECTION_PAYLOADS)(
      'deve rejeitar payload SQL no campo de filtro: "%s"',
      async (payload) => {
        const result = await fetchAPI(`/api/blog?category=${encodeURIComponent(payload)}`);
        expect(result.body).not.toContain('syntax error');
        expect(result.body).not.toContain('pg_catalog');
      }
    );
  });

  describe('API /api/auth/create-profile', () => {
    it.each(SQL_INJECTION_PAYLOADS)(
      'deve sanitizar payload no nome de perfil: "%s"',
      async (payload) => {
        const result = await fetchAPI('/api/auth/create-profile', {
          method: 'POST',
          body: JSON.stringify({ name: payload, email: `test@test.com` }),
        });
        expect([401, 400, 403, 500]).toContain(result.status);
        expect(result.body).not.toContain('syntax error');
        expect(result.body).not.toContain('pg_catalog');
      }
    );
  });

  describe('API /api/admin/courses', () => {
    it.each(SQL_INJECTION_PAYLOADS)(
      'deve proteger criação de curso contra SQL Injection: "%s"',
      async (payload) => {
        const result = await fetchAPI('/api/admin/courses', {
          method: 'POST',
          body: JSON.stringify({ title: payload, description: payload }),
        });
        // Deve retornar 401 (sem auth) — não um erro de SQL
        expect([401, 400, 403]).toContain(result.status);
        expect(result.body).not.toContain('syntax error');
        expect(result.body).not.toContain('relation "');
      }
    );
  });

  describe('API /api/enrollments', () => {
    it.each(SQL_INJECTION_PAYLOADS)(
      'deve proteger inscrição em curso contra SQL Injection: "%s"',
      async (payload) => {
        const result = await fetchAPI('/api/enrollments', {
          method: 'POST',
          body: JSON.stringify({ course_id: payload }),
        });
        expect(result.body).not.toContain('syntax error');
        expect(result.body).not.toContain('pg_catalog');
      }
    );
  });
});
