import type { FoodOrder, FoodRate, FoodSummary } from "@/types";

import { get, patch } from "./client";

const BASE = "/admin/food";

/**
 * Food coupons live on their own TIQR event, separate from accommodation, so
 * kitchen counts and coupon money are read here and nowhere else.
 */
export const getFood = () => get<FoodSummary>(BASE);

export const listFoodOrders = () =>
  get<{ orders: FoodOrder[]; count: number }>(`${BASE}/orders`);

/** Reprices on TIQR too, and fails the whole request if TIQR refuses. */
export const updateFoodRate = (id: number, price: number) =>
  patch<FoodRate>(`${BASE}/rates/${id}`, { price }, "rate");
