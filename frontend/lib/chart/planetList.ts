/**
 * The backend returns planets either as an array or as an object keyed by
 * planet name ({ Sun: {...}, Moon: {...} }). Normalise to an array with
 * `name` set, so callers can map/find safely.
 */
export function toPlanetList(planets: unknown): any[] {
  if (Array.isArray(planets)) return planets;
  if (planets && typeof planets === 'object') {
    return Object.entries(planets as Record<string, any>).map(([name, value]) =>
      value && typeof value === 'object' ? { name, ...value } : { name, value }
    );
  }
  return [];
}
