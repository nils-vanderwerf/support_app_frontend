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
  return new Promise(resolve => {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address, region: 'AU' }, (results, status) => {
      if (status === 'OK' && results?.[0]) {
        const { lat, lng } = results[0].geometry.location;
        const pos = { lat: lat(), lng: lng() };
        cache.set(key, pos);
        resolve(pos);
      } else {
        cache.set(key, null);
        resolve(null);
      }
    });
  });
}
