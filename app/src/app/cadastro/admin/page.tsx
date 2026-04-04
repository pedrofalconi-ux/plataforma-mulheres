import LoginForm from '@/components/auth/LoginForm';

export const metadata = {
  title: 'Cadastro Admin | Nathi Faria',
  description: 'Crie uma conta administrativa e acesse o painel da plataforma.',
};

export default function AdminRegisterPage() {
  return <LoginForm mode="admin-register" />;
}
