import Link from 'next/link';

const sections = [
  {
    title: 'Dados que coletamos',
    content:
      'Coletamos os dados necessários para cadastro, autenticação, matrículas, emissão de certificados e personalização básica da experiência na plataforma.',
  },
  {
    title: 'Como usamos os dados',
    content:
      'Os dados são utilizados para operar a plataforma, registrar progresso formativo, viabilizar atendimento ao usuário, cumprir obrigações legais e melhorar a segurança do serviço.',
  },
  {
    title: 'Seus direitos LGPD',
    content:
      'Você pode solicitar confirmação de tratamento, acesso, correção, portabilidade, anonimização, exclusão e exportação dos seus dados pessoais, conforme a legislação aplicável.',
  },
  {
    title: 'Compartilhamento e retenção',
    content:
      'Compartilhamos informações apenas com fornecedores essenciais para autenticação, hospedagem, pagamentos e operação da plataforma, mantendo retenção pelo tempo necessário para finalidade e conformidade.',
  },
];

export default function PrivacyPage() {
  return (
    <div className="px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="soft-card rounded-[32px] p-8 md:p-12">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-primary-600">Privacidade</p>
          <h1 className="mb-4 text-4xl font-bold text-stone-900">Política de Privacidade</h1>
          <p className="mb-10 leading-relaxed text-stone-600">
            Esta página resume como a Dignare trata dados pessoais em conformidade com a LGPD. Para exercer seus direitos, acesse sua área de perfil ou entre em contato com nossa equipe responsável.
          </p>

          <div className="grid gap-6">
            {sections.map((section) => (
              <section key={section.title} className="rounded-[24px] border border-primary-900/8 bg-white/70 p-6">
                <h2 className="mb-2 text-xl font-bold text-stone-900">{section.title}</h2>
                <p className="leading-relaxed text-stone-600">{section.content}</p>
              </section>
            ))}
          </div>

          <div className="mt-10 rounded-[24px] bg-primary-900 p-6 text-white">
            <h2 className="mb-2 text-xl font-bold">Exerça seus direitos</h2>
            <p className="mb-4 text-primary-100">
              Na página de perfil você pode exportar seus dados e solicitar a exclusão permanente da conta.
            </p>
            <Link
              href="/perfil"
              className="inline-flex items-center rounded-full bg-white px-5 py-2.5 font-bold text-primary-900 hover:bg-stone-100 transition"
            >
              Ir para meu perfil
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
