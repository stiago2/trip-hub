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

export interface InventoryItem {
  id: string;
  tripId: string;
  name: string;
  category: 'CLOTHING' | 'TECH' | 'TOILETRIES' | 'DOCUMENTS' | 'OTHER';
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
