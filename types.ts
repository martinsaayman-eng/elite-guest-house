
export enum View {
  HOME = 'home',
  ROOMS = 'rooms',
  SCHEDULE = 'schedule',
  INVOICING = 'invoicing',
  HISTORY = 'history',
  ADMIN = 'admin',
  HOUSEKEEPING = 'housekeeping',
  SETTINGS = 'settings'
}

export type UserRole = 'admin' | 'manager' | 'staff';

export interface UserContext {
  tenant_id: string;
  property_id: string;
  roles: UserRole[];
}

export type HousekeepingStatus = 'dirty' | 'cleaning' | 'clean';

export interface Room {
  id: string;
  tenant_id: string;
  property_id: string;
  name: string;
  pricePerNightCents: number;
  imageUrl: string;
  description: string;
  features: string[];
  closed_through_date?: string; // YYYY-MM-DD
}

export interface LedgerTransaction {
  id: string;
  tenant_id: string;
  property_id: string;
  booking_id: string;
  type: 'charge' | 'payment' | 'refund' | 'adjustment' | 'reversal';
  amount_cents: number;
  currency: 'ZAR';
  effective_date: string;
  created_at: string;
  source: 'system' | 'manual' | 'correction' | 'import';
  note?: string;
  created_by: string;
  role_at_time: 'admin' | 'manager' | 'staff';
  reverses_transaction_id?: string;
  is_locked: boolean;
}

export interface Booking {
  id: string;
  tenant_id: string;
  property_id: string;
  room_id: string;
  guest_name: string;
  guest_email?: string;
  guest_phone?: string;
  check_in: string;
  check_out: string;
  // Added 'completed' to status to allow marking finished stays in audit logs
  status: 'tentative' | 'confirmed' | 'cancelled' | 'completed';
  check_in_status: 'not-checked-in' | 'checked-in' | 'checked-out';
  created_at: string;
  transactions: LedgerTransaction[];
  // Booking Level Locking
  is_locked: boolean;
  locked_at?: string;
  locked_by?: string;
  lock_reason?: string;
}

export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface AnalyticsSummary {
  totalBilledCents: number;
  settledRevenueCents: number;
  pendingRevenueCents: number;
  totalOutstanding: number;
  occupancyRate: number;
  currentOccupied: number;
  totalUnits: number;
  trajectoryScale: number[];
  projectedTrajectoryScale: number[];
  monthlySettled: ChartDataPoint[];
  weeklySettled: ChartDataPoint[];
  dailySettled: ChartDataPoint[];
  monthlyProjected: number[];
  monthlyExpenses: number[];
  monthlyProfit: number[];
  arrivalsToday: number;
  monthlyRevenue: number;
  totalOwed: number;
}

export interface RestorePoint {
  id: string;
  timestamp: string;
  label: string;
  data: {
    bookings: Booking[];
    housekeeping: Record<string, HousekeepingStatus>;
  };
}

export interface Expense {
  id: string;
  date: string;
  category: string;
  amount_cents: number;
  note: string;
}
