import LoginForm from "@/components/auth/LoginForm";

export const metadata = {
  title: "Login | Dignare",
  description: "Entre na Dignare para acessar suas jornadas, comunidade e progresso.",
};

export default function LoginPage() {
  return <LoginForm mode="login" />;
}
