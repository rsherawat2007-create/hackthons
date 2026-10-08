/**
 * City and Region Level Geocoding Resolver.
 *
 * NOTE: As per privacy guidelines, this resolver ONLY maps to city/region centroids.
 * It NEVER returns or stores exact home addresses or private coordinates.
 */

export interface CityGeoLocation {
  city: string;
  country: string;
  lat: number;
  lng: number;
}

// City-level centroid coordinates
const CITY_CENTROIDS: Record<string, CityGeoLocation> = {
  "delhi": { city: "Delhi", country: "India", lat: 28.6139, lng: 77.2090 },
  "new delhi": { city: "New Delhi", country: "India", lat: 28.6139, lng: 77.2090 },
  "mumbai": { city: "Mumbai", country: "India", lat: 19.0760, lng: 72.8777 },
  "bengaluru": { city: "Bengaluru", country: "India", lat: 12.9716, lng: 77.5946 },
  "bangalore": { city: "Bengaluru", country: "India", lat: 12.9716, lng: 77.5946 },
  "london": { city: "London", country: "UK", lat: 51.5074, lng: -0.1278 },
  "los angeles": { city: "Los Angeles", country: "USA", lat: 34.0522, lng: -118.2437 },
  "la": { city: "Los Angeles", country: "USA", lat: 34.0522, lng: -118.2437 },
  "new york": { city: "New York", country: "USA", lat: 40.7128, lng: -74.0060 },
  "nyc": { city: "New York", country: "USA", lat: 40.7128, lng: -74.0060 },
  "tokyo": { city: "Tokyo", country: "Japan", lat: 35.6762, lng: 139.6503 },
  "berlin": { city: "Berlin", country: "Germany", lat: 52.5200, lng: 13.4050 },
  "paris": { city: "Paris", country: "France", lat: 48.8566, lng: 2.3522 },
  "austin": { city: "Austin", country: "USA", lat: 30.2672, lng: -97.7431 },
  "milan": { city: "Milan", country: "Italy", lat: 45.4642, lng: 9.1900 },
  "mexico city": { city: "Mexico City", country: "Mexico", lat: 19.4326, lng: -99.1332 },
  "dakar": { city: "Dakar", country: "Senegal", lat: 14.7167, lng: -17.4677 },
  "san francisco": { city: "San Francisco", country: "USA", lat: 37.7749, lng: -122.4194 },
  "seoul": { city: "Seoul", country: "South Korea", lat: 37.5665, lng: 126.9780 },
  "singapore": { city: "Singapore", country: "Singapore", lat: 1.3521, lng: 103.8198 },
  "toronto": { city: "Toronto", country: "Canada", lat: 43.6532, lng: -79.3832 },
  "sydney": { city: "Sydney", country: "Australia", lat: -33.8688, lng: 151.2093 },
  "amsterdam": { city: "Amsterdam", country: "Netherlands", lat: 52.3676, lng: 4.9041 },
  "dubai": { city: "Dubai", country: "UAE", lat: 25.2048, lng: 55.2708 },
};

/**
 * Resolves a creator location string to city/region level centroid coordinates.
 * Generates a deterministic minor dispersion (+-0.03 deg max) based on creator ID
 * to prevent markers in the same city from completely occluding one another.
 */
export function resolveCityCoordinates(
  locationString?: string | null,
  creatorId: string = ""
): { lat: number; lng: number; cityName: string; countryName: string } {
  if (!locationString || !locationString.trim()) {
    // Default fallback to London/GMT centroid if unknown
    return { lat: 51.5074, lng: -0.1278, cityName: "Global", countryName: "" };
  }

  const raw = locationString.toLowerCase();
  let matched: CityGeoLocation | null = null;

  // Try direct key matches
  for (const [key, geo] of Object.entries(CITY_CENTROIDS)) {
    if (raw.includes(key)) {
      matched = geo;
      break;
    }
  }

  // Country-level fallbacks if no city matched
  if (!matched) {
    if (raw.includes("india")) {
      matched = { city: "India (Region)", country: "India", lat: 20.5937, lng: 78.9629 };
    } else if (raw.includes("usa") || raw.includes("united states")) {
      matched = { city: "USA (Region)", country: "USA", lat: 37.0902, lng: -95.7129 };
    } else if (raw.includes("uk") || raw.includes("united kingdom")) {
      matched = { city: "UK (Region)", country: "UK", lat: 55.3781, lng: -3.4360 };
    } else if (raw.includes("japan")) {
      matched = { city: "Japan (Region)", country: "Japan", lat: 36.2048, lng: 138.2529 };
    } else if (raw.includes("germany")) {
      matched = { city: "Germany (Region)", country: "Germany", lat: 51.1657, lng: 10.4515 };
    } else if (raw.includes("italy")) {
      matched = { city: "Italy (Region)", country: "Italy", lat: 41.8719, lng: 12.5674 };
    } else {
      matched = { city: locationString.trim(), country: "", lat: 30.0, lng: 0.0 };
    }
  }

  // Pseudo-random deterministic micro-offset (< 2.5 km) so markers in same city don't stack directly
  let hash = 0;
  for (let i = 0; i < creatorId.length; i++) {
    hash = (hash << 5) - hash + creatorId.charCodeAt(i);
    hash |= 0;
  }
  const latOffset = ((Math.sin(hash) * 10000) % 1) * 0.035;
  const lngOffset = ((Math.cos(hash) * 10000) % 1) * 0.035;

  return {
    lat: matched.lat + latOffset,
    lng: matched.lng + lngOffset,
    cityName: matched.city,
    countryName: matched.country,
  };
}
