'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { ArrowRight, MapPin } from 'lucide-react';

type Project = {
  id: string;
  name: string;
  category: 'alimentacao' | 'saude' | 'educacao' | 'espiritualidade' | 'moradia';
  description: string | null;
  address: string | null;
  contact: string | null;
  lat: number | null;
  lng: number | null;
};

type ObservatoryMapProps = {
  projects: Project[];
  selectedProjectId?: string | null;
  onSelectProject?: (projectId: string) => void;
  interactive?: boolean;
  zoom?: number;
  className?: string;
};

const CATEGORY_COLORS: Record<Project['category'], string> = {
  alimentacao: '#247a52',
  saude: '#1d6244',
  educacao: '#379868',
  espiritualidade: '#5fbb85',
  moradia: '#194f38',
};

function MapViewport({ project }: { project?: Project | null }) {
  const map = useMap();

  useEffect(() => {
    if (project?.lat && project?.lng) {
      map.flyTo([project.lat, project.lng], Math.max(map.getZoom(), 14), {
        duration: 0.7,
      });
    }
  }, [map, project]);

  return null;
}

export default function ObservatoryMap({
  projects,
  selectedProjectId,
  onSelectProject,
  interactive = true,
  zoom = 11,
  className,
}: ObservatoryMapProps) {
  const projectsWithCoordinates = projects.filter(
    (project) => typeof project.lat === 'number' && typeof project.lng === 'number'
  );

  const selectedProject = projectsWithCoordinates.find((project) => project.id === selectedProjectId) || projectsWithCoordinates[0];
  const center: [number, number] = selectedProject?.lat && selectedProject?.lng
    ? [selectedProject.lat, selectedProject.lng]
    : [-23.55052, -46.633308];

  return (
    <div className={className}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={interactive}
        dragging={interactive}
        doubleClickZoom={interactive}
        touchZoom={interactive}
        zoomControl={interactive}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapViewport project={selectedProject} />

        {projectsWithCoordinates.map((project) => {
          const isSelected = project.id === selectedProjectId;
          return (
            <CircleMarker
              key={project.id}
              center={[project.lat as number, project.lng as number]}
              pathOptions={{
                color: '#ffffff',
                weight: 2,
                fillColor: CATEGORY_COLORS[project.category],
                fillOpacity: isSelected ? 1 : 0.82,
              }}
              radius={isSelected ? 11 : 8}
              eventHandlers={{
                click: () => onSelectProject?.(project.id),
              }}
            >
              <Popup>
                <div className="min-w-[220px]">
                  <div className="mb-1 flex items-start gap-2">
                    <MapPin size={14} className="mt-0.5 text-primary-700" />
                    <div>
                      <div className="font-bold text-stone-900">{project.name}</div>
                      <div className="text-xs text-stone-500">{project.address || 'Endereço não informado'}</div>
                    </div>
                  </div>
                  {project.description ? (
                    <p className="mt-2 text-sm text-stone-600">{project.description}</p>
                  ) : null}
                  <Link
                    href={`/observatorio/${project.id}`}
                    className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-primary-700"
                  >
                    Abrir projeto <ArrowRight size={14} />
                  </Link>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
