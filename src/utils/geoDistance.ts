export interface LatLng { lat: number; lng: number }

export function haversineDistance(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(h));
}

const cache = new Map<string, LatLng | null>();

export async function geocodeAddress(address: string): Promise<LatLng | null> {
  const key = address.trim().toLowerCase();
  if (cache.has(key)) return cache.get(key)!;
  try {
    const { suggestions } = await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
      input: address,
      includedRegionCodes: ['au'],
    });
    if (!suggestions.length || !suggestions[0].placePrediction) {
      console.warn('[geocodeAddress] no suggestions for:', address);
      cache.set(key, null);
      return null;
    }
    const place = suggestions[0].placePrediction.toPlace();
    await place.fetchFields({ fields: ['location'] });
    const loc = (place as any).location;
    if (!loc) { cache.set(key, null); return null; }
    const pos = { lat: loc.lat(), lng: loc.lng() };
    cache.set(key, pos);
    return pos;
  } catch (err) {
    console.error('[geocodeAddress] failed for:', address, err);
    cache.set(key, null);
    return null;
  }
}
