import type {
  AccommodationBooking,
  AccommodationSummary,
  FoodRate,
  RoomInventory,
  RoomRate,
} from "@/types";

import { get, patch } from "./client";

const BASE = "/admin/accommodation";

/**
 * Stock, pricing and live per-night availability in one read.
 *
 * Availability is computed on the backend because it depends on which NIGHTS
 * each booking occupies — two stays starting on different days can still
 * collide — so it cannot be derived from the inventory totals alone.
 */
export const getAccommodation = () => get<AccommodationSummary>(BASE);

export const listAccommodationBookings = () =>
  get<{ bookings: AccommodationBooking[]; count: number }>(`${BASE}/bookings`);

/**
 * Rejected with 409 when the new total is below what is already committed on
 * the busiest night — lowering it would not free beds, only make the ledger
 * disagree with the hostel.
 */
export const updateInventory = (id: number, total: number) =>
  patch<RoomInventory>(`${BASE}/inventory/${id}`, { total }, "inventory");

/**
 * Repricing patches TIQR too, and fails the whole request if TIQR refuses —
 * a price that differs between the two charges the buyer something other than
 * what they were shown.
 */
export const updateRoomRate = (id: number, price: number) =>
  patch<RoomRate>(`${BASE}/rooms/${id}`, { price }, "rate");

export const updateFoodRate = (id: number, price: number) =>
  patch<FoodRate>(`${BASE}/food/${id}`, { price }, "rate");
