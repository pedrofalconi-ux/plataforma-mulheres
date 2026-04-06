import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Login | Nathi Faria',
  description: 'O acesso administrativo é liberado apenas para contas existentes com permissão.',
};

export default function AdminRegisterPage() {
  redirect('/login');
}
