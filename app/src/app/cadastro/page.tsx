import LoginForm from '@/components/auth/LoginForm';

export const metadata = {
  title: 'Cadastro | É no lar onde tudo começa',
  description: 'Crie sua conta para acessar a plataforma com tranquilidade.',
};

export default function CadastroPage() {
  return <LoginForm mode="register" />;
}
