import LoginForm from "@/components/auth/LoginForm";

export const metadata = {
  title: "Criar Conta | Nathi Faria",
  description: "Torne-se parte da nossa comunidade. Comece sua jornada de formação e autoconhecimento hoje.",
};

export default function CadastroPage() {
  return <LoginForm mode="register" />;
}
