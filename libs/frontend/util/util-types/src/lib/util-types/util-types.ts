// ─── Core Entities ────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
}

export interface Trip {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  _count?: { destinations: number; transports: number };
}

export interface Destination {
  id: string;
  tripId: string;
  country: string;
  city: string;
  startDate: string;
  endDate: string;
  notes: string | null;
  updatedAt: string;
}

export type InventoryCategory = 'CLOTHING' | 'TECH' | 'TOILETRIES' | 'DOCUMENTS' | 'OTHER';

export interface InventoryItem {
  id: string;
  tripId: string;
  name: string;
  category: InventoryCategory;
  packed: boolean;
  quantity: number;
  updatedAt: string;
}

export interface BudgetItem {
  id: string;
  tripId: string;
  title: string;
  amount: string;
  category: string;
  paidByUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TripMember {
  id: string;
  tripId: string;
  userId: string;
  role: 'OWNER' | 'EDITOR' | 'VIEWER';
  joinedAt: string;
  user: Pick<User, 'id' | 'email' | 'name'>;
}

export interface Invitation {
  id: string;
  tripId: string;
  email: string;
  role: 'OWNER' | 'EDITOR' | 'VIEWER';
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  invitedAt: string;
}

export interface PendingInvitation extends Invitation {
  trip: Pick<Trip, 'id' | 'title'>;
}

// ─── Accommodation ────────────────────────────────────────────────────────────

export interface Accommodation {
  id: string;
  tripId: string;
  destinationId: string;
  name: string;
  checkIn: string;
  checkOut: string;
  address: string | null;
  price: number | null;
}

export interface CreateAccommodationPayload {
  name: string;
  checkIn: string;
  checkOut: string;
  address?: string;
  price?: number;
}

export interface UpdateAccommodationPayload {
  name?: string;
  checkIn?: string;
  checkOut?: string;
  address?: string;
  price?: number;
}

// ─── Transport ────────────────────────────────────────────────────────────────

export type TransportType = 'FLIGHT' | 'TRAIN' | 'BUS' | 'CAR';

export interface Transport {
  id: string;
  tripId: string;
  type: TransportType;
  fromLocation: string;
  toLocation: string;
  departureTime: string;
  arrivalTime: string;
  price: number | null;
}

export interface CreateTransportPayload {
  type: TransportType;
  fromLocation: string;
  toLocation: string;
  departureTime: string;
  arrivalTime: string;
  price?: number;
}

// ─── Trip Payloads ────────────────────────────────────────────────────────────

export interface CreateTripPayload {
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
}

export interface UpdateTripPayload {
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
}

// ─── Destination Payloads ─────────────────────────────────────────────────────

export interface CreateDestinationPayload {
  country: string;
  city: string;
  startDate: string;
  endDate: string;
  notes?: string;
}

export interface UpdateDestinationPayload {
  country?: string;
  city?: string;
  startDate?: string;
  endDate?: string;
  notes?: string;
}

// ─── Budget Payloads ──────────────────────────────────────────────────────────

export interface CreateBudgetItemPayload {
  title: string;
  amount: number;
  category: string;
  paidByUserId?: string;
}

// ─── Inventory Payloads ───────────────────────────────────────────────────────

export interface CreateInventoryItemPayload {
  name: string;
  category: InventoryCategory;
  quantity: number;
}

// ─── Members & Invitations Payloads ──────────────────────────────────────────

export interface InviteUserPayload {
  email: string;
  role: 'EDITOR' | 'VIEWER';
}

// ─── Activity ─────────────────────────────────────────────────────────────────

export interface ActivityItem {
  id: string;
  type: string;
  message: string;
  createdAt: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
}

// ─── Destination Activity ─────────────────────────────────────────────────────

export interface DestinationActivity {
  id: string;
  destinationId: string;
  name: string;
  category: 'CULTURE' | 'FOOD' | 'NATURE' | 'NIGHTLIFE' | 'SHOPPING' | 'OTHER';
  notes?: string | null;
  done: boolean;
  createdAt: string;
}

// ─── Document Import ──────────────────────────────────────────────────────────

export interface ExtractedTransportData {
  type: TransportType;
  fromLocation: string;
  toLocation: string;
  departureTime: string;
  arrivalTime: string;
  price?: number | null;
}

export interface ExtractedAccommodationData {
  name: string;
  checkIn: string;
  checkOut: string;
  address?: string | null;
  price?: number | null;
}

export interface TransportExtractionResult {
  type: 'transport';
  data: ExtractedTransportData;
}

export interface AccommodationExtractionResult {
  type: 'accommodation';
  data: ExtractedAccommodationData;
}

export type DocumentExtractionResult = TransportExtractionResult | AccommodationExtractionResult;
