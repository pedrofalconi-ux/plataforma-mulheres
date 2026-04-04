import LoginForm from "@/components/auth/LoginForm";

export const metadata = {
  title: "Criar Conta | Dignare",
  description: "Crie sua conta na Dignare e comece sua jornada com uma experiência mais humana e contemporânea.",
};

export default function CadastroPage() {
  return <LoginForm mode="register" />;
}
