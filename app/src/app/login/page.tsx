import LoginForm from '@/components/auth/LoginForm';

export const metadata = {
  title: 'Entrar | É no lar onde tudo começa',
  description: 'Acesse sua plataforma com tranquilidade e retome sua jornada.',
};

export default function LoginPage() {
  return <LoginForm mode="login" />;
}
