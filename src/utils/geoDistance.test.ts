import { haversineDistance, geocodeAddress } from './geoDistance';

const mockFetch = global.google.maps.places.AutocompleteSuggestion
  .fetchAutocompleteSuggestions as jest.Mock;

const makeSuggestion = (lat: number, lng: number) => ({
  placePrediction: {
    text: { text: 'Some Place, NSW, Australia' },
    toPlace: () => ({
      fetchFields: jest.fn().mockResolvedValue({}),
      location: { lat: () => lat, lng: () => lng },
    }),
  },
});

// Each test uses a unique address string to avoid hitting the module-level cache
let seq = 0;
const addr = () => `test_address_${++seq}`;

beforeEach(() => jest.clearAllMocks());

// ---------------------------------------------------------------------------
// haversineDistance
// ---------------------------------------------------------------------------

describe('haversineDistance', () => {
  it('returns 0 for identical points', () => {
    const p = { lat: -33.87, lng: 151.21 };
    expect(haversineDistance(p, p)).toBe(0);
  });

  it('is symmetric', () => {
    const sydney = { lat: -33.8688, lng: 151.2093 };
    const melbourne = { lat: -37.8136, lng: 144.9631 };
    expect(haversineDistance(sydney, melbourne)).toBeCloseTo(
      haversineDistance(melbourne, sydney),
      5
    );
  });

  it('returns ~713 km between Sydney CBD and Melbourne CBD', () => {
    const sydney = { lat: -33.8688, lng: 151.2093 };
    const melbourne = { lat: -37.8136, lng: 144.9631 };
    const dist = haversineDistance(sydney, melbourne);
    expect(dist).toBeGreaterThan(700);
    expect(dist).toBeLessThan(730);
  });

  it('returns ~9 km between Sydney Airport and Sydney CBD', () => {
    const airport = { lat: -33.9461, lng: 151.177 };
    const cbd = { lat: -33.8688, lng: 151.2093 };
    const dist = haversineDistance(airport, cbd);
    expect(dist).toBeGreaterThan(8);
    expect(dist).toBeLessThan(12);
  });

  it('handles points on opposite sides of the equator', () => {
    const north = { lat: 51.5074, lng: -0.1278 }; // London
    const south = { lat: -33.8688, lng: 151.2093 }; // Sydney
    const dist = haversineDistance(north, south);
    expect(dist).toBeGreaterThan(16000);
    expect(dist).toBeLessThan(17000);
  });
});

// ---------------------------------------------------------------------------
// geocodeAddress
// ---------------------------------------------------------------------------

describe('geocodeAddress', () => {
  it('returns lat/lng when the Places API returns a suggestion', async () => {
    mockFetch.mockResolvedValueOnce({ suggestions: [makeSuggestion(-33.87, 151.21)] });
    const result = await geocodeAddress(addr());
    expect(result).toEqual({ lat: -33.87, lng: 151.21 });
  });

  it('returns null when no suggestions are returned', async () => {
    mockFetch.mockResolvedValueOnce({ suggestions: [] });
    expect(await geocodeAddress(addr())).toBeNull();
  });

  it('returns null when the first suggestion has no placePrediction', async () => {
    mockFetch.mockResolvedValueOnce({ suggestions: [{ placePrediction: null }] });
    expect(await geocodeAddress(addr())).toBeNull();
  });

  it('returns null when the Places API throws', async () => {
    mockFetch.mockRejectedValueOnce(new Error('network error'));
    expect(await geocodeAddress(addr())).toBeNull();
  });

  it('caches results — the API is only called once for the same address', async () => {
    mockFetch.mockResolvedValue({ suggestions: [makeSuggestion(-33.87, 151.21)] });
    const a = addr();
    await geocodeAddress(a);
    await geocodeAddress(a);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('caches null results — a failed lookup is not retried', async () => {
    mockFetch.mockResolvedValue({ suggestions: [] });
    const a = addr();
    await geocodeAddress(a);
    await geocodeAddress(a);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('passes includedRegionCodes au and the address as input', async () => {
    mockFetch.mockResolvedValueOnce({ suggestions: [] });
    const a = addr();
    await geocodeAddress(a);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.objectContaining({ input: a, includedRegionCodes: ['au'] })
    );
  });
});
