const TRIP_COLORS = [
  'linear-gradient(145deg, #1a3a6e 0%, #2563eb 100%)',
  'linear-gradient(145deg, #0f766e 0%, #14b8a6 100%)',
  'linear-gradient(145deg, #7c3aed 0%, #a78bfa 100%)',
  'linear-gradient(145deg, #b45309 0%, #f59e0b 100%)',
  'linear-gradient(145deg, #be185d 0%, #f472b6 100%)',
  'linear-gradient(145deg, #166534 0%, #22c55e 100%)',
  'linear-gradient(145deg, #1e3a5f 0%, #3b82f6 100%)',
  'linear-gradient(145deg, #374151 0%, #6b7280 100%)',
];

/**
 * Deterministically maps a trip ID to a gradient background.
 * The same ID always returns the same color — no state or storage needed.
 */
export function getTripColor(tripId: string): string {
  let hash = 0;
  for (let i = 0; i < tripId.length; i++) {
    hash = (hash * 31 + tripId.charCodeAt(i)) >>> 0;
  }
  return TRIP_COLORS[hash % TRIP_COLORS.length];
}
