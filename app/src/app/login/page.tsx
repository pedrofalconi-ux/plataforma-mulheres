import LoginForm from "@/components/auth/LoginForm";

export const metadata = {
  title: "Entrar | Nathi Faria",
  description: "Acesse sua jornada de transformação e reconexão na plataforma Nathi Faria.",
};

export default function LoginPage() {
  return <LoginForm mode="login" />;
}
