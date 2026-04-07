import Link from 'next/link';
import { BRAND_EMAIL, BRAND_NAME, BRAND_TAGLINE } from '@/lib/constants';

function BrandMark() {
  return (
    <div className="flex items-center gap-2">
      <span className="font-serif text-[2.2rem] font-semibold leading-none tracking-tight text-primary-900">
        {BRAND_NAME}
      </span>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-primary-900/12 bg-[#efe6e0] text-primary-900">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
          <div>
            <div className="mb-5">
              <BrandMark />
            </div>
            <p className="max-w-sm text-sm leading-7 text-primary-900/75">
              {BRAND_TAGLINE}. Lugar onde criamos vínculos e cultivamos atitudes que transformam a casa em um lar.
            </p>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-extrabold uppercase tracking-[0.28em] text-primary-900/55">Navegação</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/" className="transition-colors hover:text-primary-900">Início</Link></li>
              <li><Link href="/sobre" className="transition-colors hover:text-primary-900">Sobre</Link></li>
              <li><Link href="/trilhas" className="transition-colors hover:text-primary-900">Aprendizado</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-extrabold uppercase tracking-[0.28em] text-primary-900/55">Conteúdo</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/privacidade" className="transition-colors hover:text-primary-900">Privacidade</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-extrabold uppercase tracking-[0.28em] text-primary-900/55">Contato</h4>
            <p className="mb-3 text-sm text-primary-900">{BRAND_EMAIL}</p>
            <p className="text-sm leading-7 text-primary-900/70">
              O modo como você vive na sua casa revela o que é verdadeiramente importante para você.
            </p>
            <div className="mt-5 flex gap-3">
              <a
                href="https://www.instagram.com/nathifaria/"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram da Nathi Faria"
                className="border border-primary-900/15 px-3 py-2 text-[11px] font-extrabold uppercase tracking-[0.18em] transition-colors hover:bg-primary-900 hover:text-white"
              >
                IG
              </a>
              <a
                href="https://www.youtube.com/@NathiFariaenolarondetudocomeca"
                target="_blank"
                rel="noreferrer"
                aria-label="YouTube da Nathi Faria"
                className="border border-primary-900/15 px-3 py-2 text-[11px] font-extrabold uppercase tracking-[0.18em] transition-colors hover:bg-primary-900 hover:text-white"
              >
                YT
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-primary-900/10 pt-6 text-xs text-primary-900/55">
          &copy; {new Date().getFullYear()} {BRAND_NAME}. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}
