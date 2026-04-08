import LoginForm from '@/components/auth/LoginForm';

export const metadata = {
  title: 'Cadastro Admin | É no lar onde tudo começa',
  description: 'Crie um acesso administrativo e valide sua chave de administrador.',
};

export default function AdminRegisterPage() {
  return <LoginForm mode="admin-register" />;
}
