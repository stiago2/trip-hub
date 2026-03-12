import { SetMetadata } from '@nestjs/common';

export type TripRole = 'OWNER' | 'EDITOR' | 'VIEWER';

export const TRIP_ROLES_KEY = 'tripRoles';

export const TripRoles = (...roles: TripRole[]) => SetMetadata(TRIP_ROLES_KEY, roles);
