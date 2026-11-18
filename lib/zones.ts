export const zones = [
  { id: 'zone-1', label: 'Zone 1' },
  { id: 'zone-2', label: 'Zone 2' },
  { id: 'zone-3', label: 'Zone 3' },
] as const;
export type ZoneId = typeof zones[number]['id'];
export const ZONE_STORAGE_KEY = 'goodness:zone:v1';
export function isZone(value: unknown): value is ZoneId {
  return zones.some(zone => zone.id === value);
}
export function requestZone(request: Request): ZoneId | null {
  const value = request.headers.get('x-logbook-zone');
  return isZone(value) ? value : null;
}
