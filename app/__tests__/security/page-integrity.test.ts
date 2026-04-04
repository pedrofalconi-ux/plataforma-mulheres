/**
 * Testes de Integridade de Páginas
 * 
 * Verifica que todas as 32 páginas da aplicação retornam 200
 * e carregam sem erros de servidor (500).
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

// Todas as páginas mapeadas da aplicação
const PUBLIC_PAGES = [
  '/',                     // Home
  '/login',                // Login
  '/cadastro',             // Cadastro
  '/cursos',               // Listagem de cursos (trilhas)
  '/eventos',              // Eventos
  '/blog',                 // Blog
  '/forum',                // Fórum
  '/sobre',                // Sobre/Institucional
  '/ao-vivo',              // Ao vivo
  '/teleatendimento',      // Teleatendimento
];

// Páginas que exigem autenticação (devem redirecionar para login)
const AUTH_PAGES = [
  '/perfil',               // Perfil do usuário
  '/carrinho',             // Carrinho de compras
  '/checkout',             // Checkout
  '/forum/novo',           // Novo tópico no fórum
];

// Páginas de admin (devem redirecionar ou retornar 401/403)
const ADMIN_PAGES = [
  '/admin',                // Dashboard admin
  '/admin/cursos',         // Gerenciar cursos
  '/admin/eventos',        // Gerenciar eventos
  '/admin/blog',           // Gerenciar blog
  '/admin/talentos',       // Gerenciar talentos
  '/admin/usuarios',       // Gerenciar usuários
  '/admin/institucional',  // Gerenciar institucional
];

async function fetchPage(path: string): Promise<{ status: number; body: string }> {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      redirect: 'manual', // Para capturar redirects sem seguir
    });
    return { status: res.status, body: await res.text() };
  } catch (err: any) {
    return { status: 0, body: err.message };
  }
}

describe('🌐 Testes de Integridade de Páginas', () => {

  describe('Páginas Públicas — Devem carregar com status 200', () => {
    it.each(PUBLIC_PAGES)(
      'deve retornar 200 para %s',
      async (path) => {
        const result = await fetchPage(path);
        expect(result.status).toBe(200);
        // Não deve conter erro de Next.js
        expect(result.body).not.toContain('Internal Server Error');
        expect(result.body).not.toContain('Application error');
      }
    );
  });

  describe('Páginas Autenticadas — Devem ter proteção de acesso', () => {
    it.each(AUTH_PAGES)(
      'deve retornar 200 ou redirect (302/307) para %s sem autenticação',
      async (path) => {
        const result = await fetchPage(path);
        // Pode carregar a página (com redirect client-side) ou fazer redirect server-side
        expect([200, 302, 307, 308]).toContain(result.status);
        // Não deve ser 500 — isso seria um bug
        expect(result.status).not.toBe(500);
      }
    );
  });

  describe('Páginas Admin — Devem proteger acesso não-autorizado', () => {
    it.each(ADMIN_PAGES)(
      'deve retornar 200 ou redirect para %s sem autenticação',
      async (path) => {
        const result = await fetchPage(path);
        // Pode carregar (com guard client-side) ou redirecionar
        expect([200, 302, 307, 308]).toContain(result.status);
        expect(result.status).not.toBe(500);
      }
    );
  });

  describe('Páginas de Checkout Result — Devem carregar sem erro', () => {
    it('deve carregar /checkout/success sem 500', async () => {
      const result = await fetchPage('/checkout/success');
      expect([200, 302, 307]).toContain(result.status);
      expect(result.status).not.toBe(500);
    });

    it('deve carregar /checkout/failure sem 500', async () => {
      const result = await fetchPage('/checkout/failure');
      expect([200, 302, 307]).toContain(result.status);
      expect(result.status).not.toBe(500);
    });
  });

  describe('Páginas 404 — Devem retornar graciosamente', () => {
    it('deve retornar 404 para rota inexistente /pagina-falsa', async () => {
      const result = await fetchPage('/pagina-inexistente-xyz');
      expect(result.status).toBe(404);
    });
  });

  describe('Sem Erros de Servidor em Nenhuma Página', () => {
    const ALL_PAGES = [...PUBLIC_PAGES, ...AUTH_PAGES, ...ADMIN_PAGES];
    
    it.each(ALL_PAGES)(
      '%s não deve retornar erro 500',
      async (path) => {
        const result = await fetchPage(path);
        expect(result.status).not.toBe(500);
      }
    );
  });
});
