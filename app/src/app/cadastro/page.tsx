import { redirect } from 'next/navigation';
import LoginForm from '@/components/auth/LoginForm';

export const metadata = {
  title: 'Cadastro | Nathi Faria',
  description: 'Finalize seu cadastro para acessar a plataforma após a confirmação do pagamento.',
};

export default async function CadastroPage({
  searchParams,
}: {
  searchParams: Promise<{ bought?: string }>;
}) {
  const params = await searchParams;

  if (params.bought !== 'true') {
    redirect('/login');
  }

  return <LoginForm mode="register" />;
}
