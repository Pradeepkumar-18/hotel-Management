/**
 * Core domain enums and contracts for Staywise Hotel Platform
 */

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  HOTEL_MANAGER = 'HOTEL_MANAGER',
  GUEST = 'GUEST',
}

export enum BookingStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  CONFIRMED = 'CONFIRMED',
  CHECKED_IN = 'CHECKED_IN',
  CHECKED_OUT = 'CHECKED_OUT',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
  PAYMENT_REVIEW = 'PAYMENT_REVIEW',
}

export enum HoldStatus {
  ACTIVE = 'ACTIVE',
  CONVERTED = 'CONVERTED',
  EXPIRED = 'EXPIRED',
  RELEASED = 'RELEASED',
}

export enum PaymentStatus {
  NOT_REQUIRED = 'NOT_REQUIRED',
  PENDING = 'PENDING',
  AUTHORIZED = 'AUTHORIZED',
  CAPTURED = 'CAPTURED',
  FAILED = 'FAILED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
  REFUNDED = 'REFUNDED',
}

export enum HotelStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  DISABLED = 'DISABLED',
  ARCHIVED = 'ARCHIVED',
}

export interface StayDates {
  /** Check-in date (inclusive) in YYYY-MM-DD */
  checkIn: string;
  /** Checkout date (exclusive) in YYYY-MM-DD */
  checkOut: string;
}

export interface OccupancyRequirement {
  adults: number;
  children: number;
  roomsCount: number;
}
