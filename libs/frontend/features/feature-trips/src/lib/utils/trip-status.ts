import { Trip } from '@org/util-types';

export type TripStatus = 'upcoming' | 'active' | 'past';

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Computes the status of a trip based on the current date.
 *
 * - upcoming : today < startDate
 * - active   : startDate <= today <= endDate  (same-day trips are active all day)
 * - past     : today > endDate
 *
 * If startDate or endDate is missing the trip is treated as "upcoming".
 */
export function getTripStatus(trip: Pick<Trip, 'startDate' | 'endDate'>): TripStatus {
  if (!trip.startDate || !trip.endDate) return 'upcoming';

  const today = startOfDay(new Date());
  const start = startOfDay(new Date(trip.startDate));
  const end   = startOfDay(new Date(trip.endDate));

  if (today < start) return 'upcoming';
  if (today <= end)  return 'active';
  return 'past';
}

function diffDays(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / 86_400_000);
}

export function getTripTimeInfo(trip: Pick<Trip, 'startDate' | 'endDate'>): string {
  if (!trip.startDate || !trip.endDate) return '';

  const today = startOfDay(new Date());
  const start = startOfDay(new Date(trip.startDate));
  const end   = startOfDay(new Date(trip.endDate));
  const status = getTripStatus(trip);

  if (status === 'upcoming') {
    const days = diffDays(start, today);
    if (days === 0) return 'Starts today';
    if (days === 1) return 'Starts tomorrow';
    return `Starts in ${days} days`;
  }

  if (status === 'active') {
    const currentDay  = diffDays(today, start) + 1;
    const totalDays   = diffDays(end, start) + 1;
    return `Day ${currentDay} of ${totalDays}`;
  }

  // past
  const days = diffDays(today, end);
  if (days === 1) return 'Ended yesterday';
  if (days > 30) {
    const months = Math.round(days / 30);
    return `Ended ${months} month${months > 1 ? 's' : ''} ago`;
  }
  return `Ended ${days} days ago`;
}
