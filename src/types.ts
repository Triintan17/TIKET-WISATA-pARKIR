export type TicketCategory = 'dewasa' | 'anak' | 'mancanegara' | 'terusan';
export type VehicleType = 'motor' | 'mobil' | 'bus' | 'none';
export type PaymentMethod = 'qris' | 'cash' | 'emoney';
export type TicketStatus = 'active' | 'used' | 'checked_out';

export interface TicketItem {
  id: TicketCategory;
  name: string;
  categoryName: string;
  price: number;
  description: string;
  highlight?: string;
}

export interface ParkingFeeConfig {
  type: VehicleType;
  label: string;
  flatFee: number;
  hourlyFee: number;
  icon: string;
}

export interface TransactionTicket {
  id: string; // e.g., "TIX-20261018-8421"
  qrPayload: string;
  destination: string;
  createdAt: number;
  items: {
    id: TicketCategory;
    name: string;
    price: number;
    qty: number;
  }[];
  totalVisitors: number;
  parking: {
    enabled: boolean;
    vehicleType: VehicleType;
    vehicleLabel: string;
    licensePlate: string;
    fee: number;
    entryTime: number;
    exitTime?: number;
  } | null;
  subtotal: number;
  discount: number;
  voucherCode?: string;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  cashPaid?: number;
  change?: number;
  loyaltyEarned: number;
  status: TicketStatus;
  checkInTime?: number;
  checkOutTime?: number;
  deviceSource: 'kiosk' | 'handheld_pos' | 'loket';
}

export interface ParkingCapacity {
  motorTotal: number;
  motorOccupied: number;
  mobilTotal: number;
  mobilOccupied: number;
  busTotal: number;
  busOccupied: number;
}

export interface Voucher {
  code: string;
  title: string;
  discountAmount: number;
  minSpend: number;
  pointCost: number;
}
