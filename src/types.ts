export type UserRole = 'firm' | 'courier' | 'admin';
export type DeliveryStatus = 'pending' | 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled';
export type UrgencyLevel = 'standard' | 'same-day' | 'urgent';

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  name: string;
  firmName?: string;
  verificationStatus?: 'pending' | 'verified' | 'rejected';
  rating?: number;
  createdAt: any;
}

export interface ChainOfCustodyEntry {
  timestamp: any;
  status: string;
  location?: { lat: number; lng: number };
  actorId: string;
  actorName: string;
  notes?: string;
}

export interface DeliveryRequest {
  id: string;
  firmId: string;
  courierId?: string;
  pickupAddress: string;
  dropoffAddress: string;
  documentType: string;
  urgency: UrgencyLevel;
  instructions?: string;
  status: DeliveryStatus;
  createdAt: any;
  updatedAt: any;
  chainOfCustody: ChainOfCustodyEntry[];
  verificationCode?: string;
  distance?: number;
  price?: number;
}
