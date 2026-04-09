import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ExternalLink, MapPin, Phone } from 'lucide-react';
import ObservatoryMap from '@/components/observatory/ObservatoryMap';
import { getProjectById } from '@/services/projects';

export default async function ObservatoryProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let project: any;
  try {
    project = await getProjectById(id);
  } catch {
    notFound();
  }

  if (!project || project.status !== 'approved') {
    notFound();
  }

  return (
    <div className="px-4 pb-14 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/observatorio"
          className="inline-flex items-center gap-2 rounded-full border border-primary-900/10 bg-white px-4 py-2 text-sm font-bold text-stone-700 transition hover:bg-primary-50"
        >
          <ArrowLeft size={16} /> Voltar ao observatorio
        </Link>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="hero-sheen rounded-[34px] px-6 py-8 text-white shadow-[0_25px_80px_rgba(22,63,46,0.14)] sm:px-8">
            <div className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em]">
              {project.category}
            </div>
            <h1 className="mt-4 font-serif text-4xl font-bold md:text-5xl">{project.name}</h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-primary-100">
              {project.description || 'Esta iniciativa ainda não possui uma descrição detalhada cadastrada.'}
            </p>
          </div>

          <div className="soft-card rounded-[34px] p-6">
            <h2 className="font-serif text-2xl font-bold text-stone-900">Encaminhamentos</h2>
            <div className="mt-5 space-y-5 text-sm text-stone-600">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary-600">Local da ação</p>
                <p className="mt-1 flex items-start gap-2">
                  <MapPin size={16} className="mt-0.5 text-primary-700" />
                  <span>{project.address || 'Endereço não informado'}</span>
                </p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary-600">Contato</p>
                <p className="mt-1 flex items-start gap-2">
                  <Phone size={16} className="mt-0.5 text-primary-700" />
                  <span>{project.contact || 'Contato não informado'}</span>
                </p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary-600">Coordenadas</p>
                <p className="mt-1">
                  {typeof project.lat === 'number' && typeof project.lng === 'number'
                    ? `${project.lat.toFixed(5)}, ${project.lng.toFixed(5)}`
                    : 'Sem coordenadas georreferenciadas'}
                </p>
              </div>
            </div>

            {typeof project.lat === 'number' && typeof project.lng === 'number' ? (
              <a
                href={`https://www.openstreetmap.org/?mlat=${project.lat}&mlon=${project.lng}#map=16/${project.lat}/${project.lng}`}
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-primary-800"
              >
                Abrir no OpenStreetMap <ExternalLink size={16} />
              </a>
            ) : null}
          </div>
        </section>

        <section className="glass-panel mt-6 overflow-hidden rounded-[34px]">
          <div className="border-b border-primary-900/8 px-6 py-4">
            <h2 className="font-serif text-2xl font-bold text-stone-900">Mapa do projeto</h2>
            <p className="text-sm text-stone-500">Referência geográfica da ação usando OpenStreetMap.</p>
          </div>
          <div className="h-[520px]">
            <ObservatoryMap
              projects={[project]}
              selectedProjectId={project.id}
              interactive
              zoom={14}
              className="h-full w-full"
            />
          </div>
        </section>
      </div>
    </div>
  );
}
