/**
 * Testes de Autenticação e Autorização
 * 
 * Valida que rotas protegidas (admin, perfil, operações CRUD) 
 * retornam 401/403 quando acessadas sem autenticação.
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

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

describe('🔐 Testes de Autenticação e Autorização', () => {

  describe('Rotas Admin — Devem exigir autenticação', () => {
    const adminRoutes = [
      { method: 'POST' as const, path: '/api/admin/courses', body: { title: 'Test' } },
      { method: 'PATCH' as const, path: '/api/admin/courses', body: { id: 'fake', title: 'Test' } },
      { method: 'DELETE' as const, path: '/api/admin/courses?id=fake' },
      { method: 'POST' as const, path: '/api/admin/events', body: { title: 'Test' } },
      { method: 'POST' as const, path: '/api/admin/lessons', body: { title: 'Test' } },
      { method: 'POST' as const, path: '/api/admin/modules', body: { title: 'Test' } },
      { method: 'POST' as const, path: '/api/admin/observatorio', body: { title: 'Test' } },
      { method: 'POST' as const, path: '/api/admin/talents', body: { title: 'Test' } },
    ];

    it.each(adminRoutes)(
      'deve retornar 401/403 para $method $path sem autenticação',
      async ({ method, path, body }) => {
        const result = await fetchAPI(path, {
          method,
          ...(body ? { body: JSON.stringify(body) } : {}),
        });
        expect([401, 403]).toContain(result.status);
      }
    );
  });

  describe('Rotas de Perfil — Devem exigir autenticação', () => {
    it('deve retornar 401 ao atualizar perfil sem auth', async () => {
      const result = await fetchAPI('/api/profile/update', {
        method: 'POST',
        body: JSON.stringify({ name: 'Hacker' }),
      });
      expect([401, 403]).toContain(result.status);
    });
  });

  describe('Rotas de Inscrição — Devem exigir autenticação', () => {
    it('deve retornar 401 ao se inscrever em curso sem auth', async () => {
      const result = await fetchAPI('/api/enrollments', {
        method: 'POST',
        body: JSON.stringify({ course_id: 'fake-id' }),
      });
      expect([401, 403]).toContain(result.status);
    });
  });

  describe('Rotas de Progresso — Devem exigir autenticação', () => {
    it('deve retornar 401 ao registrar progresso sem auth', async () => {
      const result = await fetchAPI('/api/progress', {
        method: 'POST',
        body: JSON.stringify({ lesson_id: 'fake', completed: true }),
      });
      expect([401, 403]).toContain(result.status);
    });
  });

  describe('Rotas de Checkout — Devem exigir autenticação', () => {
    it('deve retornar 401 ao criar checkout sem auth', async () => {
      const result = await fetchAPI('/api/checkout', {
        method: 'POST',
        body: JSON.stringify({ items: [] }),
      });
      expect([401, 403]).toContain(result.status);
    });

    it('deve retornar 401 ao criar preference sem auth', async () => {
      const result = await fetchAPI('/api/checkout/preference', {
        method: 'POST',
        body: JSON.stringify({ items: [] }),
      });
      expect([401, 403]).toContain(result.status);
    });
  });

  describe('Rotas de Certificado — Devem exigir autenticação', () => {
    it('deve retornar 401 ao gerar certificado sem auth', async () => {
      const result = await fetchAPI('/api/certificates', {
        method: 'POST',
        body: JSON.stringify({ course_id: 'fake' }),
      });
      expect([401, 403]).toContain(result.status);
    });
  });

  describe('Admin Upgrade — Deve rejeitar sem credenciais válidas', () => {
    it('deve retornar 401/403 ao tentar upgrade de admin sem auth', async () => {
      const result = await fetchAPI('/api/auth/admin-upgrade', {
        method: 'POST',
        body: JSON.stringify({ secret: 'wrong-secret' }),
      });
      expect([401, 403, 400]).toContain(result.status);
    });
  });

  describe('Rotas Públicas — Devem funcionar sem auth', () => {
    it('GET /api/courses deve retornar 200', async () => {
      const result = await fetchAPI('/api/courses');
      expect(result.status).toBe(200);
    });

    it('GET /api/events deve retornar 200', async () => {
      const result = await fetchAPI('/api/events');
      expect(result.status).toBe(200);
    });

    it('GET /api/blog deve retornar 200', async () => {
      const result = await fetchAPI('/api/blog');
      expect(result.status).toBe(200);
    });

    it('GET /api/forum deve retornar 200', async () => {
      const result = await fetchAPI('/api/forum');
      expect(result.status).toBe(200);
    });

    it('GET /api/institucional deve retornar 200', async () => {
      const result = await fetchAPI('/api/institucional');
      expect(result.status).toBe(200);
    });
  });
});
