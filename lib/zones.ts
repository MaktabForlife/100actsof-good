export const zones = [
  { id: 'zone-1', label: 'Zone 1', logbookId: '10000000-0000-4000-8000-000000000001' },
  { id: 'zone-2', label: 'Zone 2', logbookId: '10000000-0000-4000-8000-000000000002' },
  { id: 'zone-3', label: 'Zone 3', logbookId: '10000000-0000-4000-8000-000000000003' },
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

export function zoneLogbookId(zone: ZoneId): string {
  return zones.find(item => item.id === zone)!.logbookId;
}
