import Link from 'next/link';
import { BRAND_EMAIL, BRAND_NAME, BRAND_TAGLINE } from '@/lib/constants';

function BrandMark() {
  return (
    <div className="flex items-center gap-2">
      <span className="font-serif text-2xl font-bold text-white">{BRAND_NAME}</span>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-primary-900/10 bg-primary-900 text-primary-100">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          <div className="md:col-span-1">
            <div className="mb-4">
              <BrandMark />
            </div>
            <p className="max-w-sm text-sm leading-6 text-primary-200/85">
              {BRAND_TAGLINE}. Uma formação dedicada à ordem no lar, à educação com intencionalidade e ao florescimento da vocação feminina.
            </p>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-white">Explorar</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/sobre" className="hover:text-white transition-colors">Manifesto</Link></li>
              <li><Link href="/trilhas" className="hover:text-white transition-colors">Minhas Trilhas</Link></li>
              <li><Link href="/blog" className="hover:text-white transition-colors">Conteúdos</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-white">Plataforma</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/eventos" className="hover:text-white transition-colors">Eventos</Link></li>
              <li><Link href="/forum" className="hover:text-white transition-colors">Comunidade</Link></li>
              <li><Link href="/privacidade" className="hover:text-white transition-colors">Privacidade</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-white">Contato</h4>
            <p className="mb-3 text-sm text-primary-200">{BRAND_EMAIL}</p>
            <p className="text-sm leading-6 text-primary-200/80">
              Cuidado e profundidade em cada passo da sua jornada.
            </p>
            <div className="mt-5 flex gap-3">
              <div className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wide">IG</div>
              <div className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wide">YT</div>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 text-xs text-primary-200/65">
          &copy; {new Date().getFullYear()} {BRAND_NAME}. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}
