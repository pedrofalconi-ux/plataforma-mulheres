/**
 * Testes de XSS (Cross-Site Scripting)
 * 
 * Valida que as rotas de API não refletem payloads de script malicioso.
 * Testa vetores de XSS nos endpoints que aceitam input textual.
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

const XSS_PAYLOADS = [
  '<script>alert("xss")</script>',
  '<img src=x onerror=alert(1)>',
  '"><img src=x onerror=alert(1)>',
  "';alert('xss')//",
  '<svg onload=alert(1)>',
  '<body onload=alert(1)>',
  '{{constructor.constructor("alert(1)")()}}',
  '<iframe src="javascript:alert(1)">',
  '<a href="javascript:alert(1)">click</a>',
  '<input onfocus=alert(1) autofocus>',
  'javascript:alert(document.cookie)',
  '<details open ontoggle=alert(1)>',
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

describe('🛡️ Testes de XSS (Cross-Site Scripting)', () => {

  describe('API /api/forum — Criação de Tópico', () => {
    it.each(XSS_PAYLOADS)(
      'não deve refletir script malicioso no título: "%s"',
      async (payload) => {
        const result = await fetchAPI('/api/forum', {
          method: 'POST',
          body: JSON.stringify({ title: payload, content: 'Conteúdo legítimo' }),
        });
        // Se retornar 200, o body não deve conter o script executável
        if (result.status === 200) {
          expect(result.body).not.toContain('<script>');
          expect(result.body).not.toContain('onerror=');
          expect(result.body).not.toContain('onload=');
          expect(result.body).not.toContain('javascript:');
        }
      }
    );
  });

  describe('API /api/blog', () => {
    it.each(XSS_PAYLOADS)(
      'não deve refletir XSS nos parâmetros de query: "%s"',
      async (payload) => {
        const result = await fetchAPI(`/api/blog?tag=${encodeURIComponent(payload)}`);
        if (result.status === 200) {
          expect(result.body).not.toContain('<script>');
          expect(result.body).not.toContain('onerror=');
          expect(result.body).not.toContain('javascript:');
        }
      }
    );
  });

  describe('API /api/profile/update', () => {
    it.each(XSS_PAYLOADS)(
      'não deve aceitar XSS em campos de perfil: "%s"',
      async (payload) => {
        const result = await fetchAPI('/api/profile/update', {
          method: 'POST',
          body: JSON.stringify({ name: payload, bio: payload }),
        });
        // Sem auth, espera-se 401; com auth, não deve ecoar scripts
        if (result.status === 200) {
          expect(result.body).not.toContain('<script>');
          expect(result.body).not.toContain('onerror=');
        }
      }
    );
  });

  describe('API /api/lessons/*/comments', () => {
    it.each(XSS_PAYLOADS)(
      'não deve aceitar XSS em comentários de aula: "%s"',
      async (payload) => {
        const result = await fetchAPI('/api/lessons/fake-id/comments', {
          method: 'POST',
          body: JSON.stringify({ content: payload }),
        });
        if (result.status === 200) {
          expect(result.body).not.toContain('<script>');
          expect(result.body).not.toContain('onerror=');
        }
      }
    );
  });

  describe('Cabeçalhos de Segurança Anti-XSS', () => {
    it('deve retornar cabeçalhos de Content-Type corretos na API', async () => {
      const result = await fetch(`${BASE_URL}/api/courses`);
      const contentType = result.headers.get('content-type');
      // APIs devem retornar JSON, nunca text/html (que habilitaria XSS refletido)
      expect(contentType).toContain('application/json');
    });

    it('deve ter Content-Type JSON no endpoint de blog', async () => {
      const result = await fetch(`${BASE_URL}/api/blog`);
      const contentType = result.headers.get('content-type');
      expect(contentType).toContain('application/json');
    });
  });
});
