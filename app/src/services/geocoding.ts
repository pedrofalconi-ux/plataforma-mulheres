type Coordinates = {
  lat: number | null;
  lng: number | null;
};

export async function geocodeAddress(address: string): Promise<Coordinates> {
  const normalized = address.trim();
  if (!normalized) {
    return { lat: null, lng: null };
  }

  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', normalized);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('limit', '1');
  url.searchParams.set('countrycodes', 'br');

  try {
    const response = await fetch(url.toString(), {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'DignareObservatorio/1.0 (contato@dignare.org)',
      },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      return { lat: null, lng: null };
    }

    const results = await response.json();
    const first = Array.isArray(results) ? results[0] : null;

    if (!first?.lat || !first?.lon) {
      return { lat: null, lng: null };
    }

    return {
      lat: Number(first.lat),
      lng: Number(first.lon),
    };
  } catch {
    return { lat: null, lng: null };
  }
}
