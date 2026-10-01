import { clearSession, getSession, setSession, updateSessionUser } from "@/libs/auth-session";
import type { UserCreate, UserRead, UserUpdate } from "@/types/api";

/** Temporary dummy account standing in for `authService`. Delete along with `mocks/`. */

export const MOCK_USER: UserRead = {
  id: "user-mock-1",
  full_name: "Tricia Kanate",
  email: "tricia@example.com",
  phone_number: "+233241112233",
  avatar_url: null,
  date_of_birth: null,
  gender: null,
  city: "Accra",
  region: "Greater Accra",
  allow_notifications: true,
  discount_notifications: true,
  store_notifications: true,
  vendor_order_notifications: false,
  vendor_notify_orders: false,
  vendor_notify_inventory: false,
  vendor_notify_reviews: false,
  vendor_notify_payouts: false,
  system_notifications: true,
  location_notifications: true,
  location_updates: true,
  personalization_enabled: true,
  analytics_enabled: true,
  role: "customer",
  admin_permission: null,
  roles: ["customer"],
  vendor_status: "none",
  vendor_id: null,
  vendor_rejection_reason: null,
  is_active: true,
  is_verified: true,
  phone_verified: true,
  last_login_at: new Date().toISOString(),
  created_at: new Date(Date.now() - 90 * 86_400_000).toISOString(),
  updated_at: new Date().toISOString(),
};

const ONE_DAY_SECONDS = 86_400;

/** Any credentials "work" — this stands in for the real login call, not a security check. */
export function mockLogin(_input: { email: string; password: string }) {
  setSession("mock-token", ONE_DAY_SECONDS, MOCK_USER);
  return { access_token: "mock-token", expires_in: ONE_DAY_SECONDS, user: MOCK_USER };
}

export function mockSignup(input: UserCreate) {
  const user: UserRead = { ...MOCK_USER, full_name: input.full_name, email: input.email, phone_number: input.phone_number ?? null };
  setSession("mock-token", ONE_DAY_SECONDS, user);
  return { access_token: "mock-token", expires_in: ONE_DAY_SECONDS, user };
}

export function mockLogout() {
  clearSession();
}

/** Merges the patch into the current session user and persists it, same shape as a real PATCH /me. */
export function mockUpdateMe(input: UserUpdate): UserRead {
  const current = getSession()?.user ?? MOCK_USER;
  const updated: UserRead = {
    ...current,
    full_name: input.full_name?.trim() || current.full_name,
    phone_number: input.phone_number !== undefined ? input.phone_number : current.phone_number,
    city: input.city !== undefined ? input.city : current.city,
    region: input.region !== undefined ? input.region : current.region,
    allow_notifications: input.allow_notifications ?? current.allow_notifications,
    discount_notifications: input.discount_notifications ?? current.discount_notifications,
    store_notifications: input.store_notifications ?? current.store_notifications,
    updated_at: new Date().toISOString(),
  };
  updateSessionUser(updated);
  return updated;
}
