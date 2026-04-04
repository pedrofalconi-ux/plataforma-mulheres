import Image from 'next/image';
import Link from 'next/link';
import { BRAND_EMAIL, BRAND_NAME, BRAND_TAGLINE } from '@/lib/constants';

function BrandMark() {
  return (
    <div className="relative h-14 w-44 overflow-hidden">
      <Image
        src="/logo.png.png"
        alt="Logo Dignare"
        fill
        className="object-contain object-left"
        priority
      />
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="motion-float mt-20 border-t border-primary-900/10 bg-[linear-gradient(180deg,#103425_0%,#0d281d_100%)] text-primary-100">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="motion-list grid grid-cols-1 gap-10 md:grid-cols-4">
          <div className="md:col-span-1">
            <div className="mb-4 flex items-center">
              <BrandMark />
            </div>
            <p className="max-w-sm text-sm leading-6 text-primary-200/85">
              {BRAND_TAGLINE}. Uma plataforma com tom mais acolhedor, verde e contemporaneo para aprender, participar e agir.
            </p>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-white">Explorar</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/sobre" className="motion-button hover:text-white">Manifesto</Link></li>
              <li><Link href="/trilhas" className="motion-button hover:text-white">Minhas Trilhas</Link></li>
              <li><Link href="/observatorio" className="motion-button hover:text-white">Observatorio</Link></li>
              <li><Link href="/blog" className="motion-button hover:text-white">Conteudos</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-white">Plataforma</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/eventos" className="motion-button hover:text-white">Eventos</Link></li>
              <li><Link href="/forum" className="motion-button hover:text-white">Comunidade</Link></li>
              <li><Link href="/checkout" className="motion-button hover:text-white">Planos e compras</Link></li>
              <li><Link href="/privacidade" className="motion-button hover:text-white">Privacidade</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-white">Contato</h4>
            <p className="mb-3 text-sm text-primary-200">{BRAND_EMAIL}</p>
            <p className="text-sm leading-6 text-primary-200/80">
              Atendimento humano, comunidade ativa e jornadas de aprendizagem com foco em clareza, cuidado e transformacao real.
            </p>
            <div className="mt-5 flex gap-3">
              <div className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wide">IG</div>
              <div className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wide">YT</div>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 text-xs text-primary-200/65">
          (c) 2026 {BRAND_NAME}. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}
