import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Login | Nathi Faria',
  description: 'O acesso à plataforma é exclusivo para contas já cadastradas e liberadas.',
};

export default function CadastroPage() {
  redirect('/login');
}
