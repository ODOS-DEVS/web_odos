import { z } from "zod";
import { GHANA_REGIONS } from "@/libs/checkout";

/** Zod schemas shared by every form in the app (via `react-hook-form` + `zodResolver`). One source of
 * truth for validation rules — reuse a schema (or its pieces) instead of re-deriving the rules inline. */

const ghanaPhonePattern = /^(?:\+233|0)\d{9}$/;

export const ghanaPhoneSchema = z.string().trim().min(1, "Phone number is required").regex(ghanaPhonePattern, "Enter a valid Ghana phone number");

/** Same pattern, but empty is allowed — for optional phone fields. */
export const optionalGhanaPhoneSchema = z
  .string()
  .trim()
  .regex(ghanaPhonePattern, "Enter a valid Ghana phone number")
  .optional()
  .or(z.literal(""));

export const emailSchema = z.string().trim().min(1, "Email is required").email("Enter a valid email address");

export const regionSchema = z.enum(GHANA_REGIONS);

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});
export type LoginFormValues = z.infer<typeof loginSchema>;

export const signupSchema = z.object({
  name: z.string().trim().min(1, "Full name is required"),
  email: emailSchema,
  phone: optionalGhanaPhoneSchema,
  password: z.string().min(8, "At least 8 characters"),
});
export type SignupFormValues = z.infer<typeof signupSchema>;

// ---------------------------------------------------------------------------
// Profile — personal details
// ---------------------------------------------------------------------------

export const profileDetailsSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  otherNames: z.string().trim().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  phone: optionalGhanaPhoneSchema,
  city: z.string().trim().optional(),
  region: regionSchema,
});
export type ProfileDetailsFormValues = z.infer<typeof profileDetailsSchema>;

// ---------------------------------------------------------------------------
// Payment methods
// ---------------------------------------------------------------------------

export const cardNumberSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/\s+/g, ""))
  .pipe(z.string().regex(/^\d{13,19}$/, "Enter a valid card number"));

export const cardExpirySchema = z
  .string()
  .trim()
  .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "Use MM/YY")
  .refine((value) => {
    const [month, year] = value.split("/").map(Number);
    // Expiry is "valid through" the whole month, so compare against its first moment next month.
    return new Date(2000 + year, month) > new Date();
  }, "Card has expired");

export const cardCvvSchema = z.string().trim().regex(/^\d{3,4}$/, "Enter a valid security code");

export const addMomoMethodSchema = z.object({
  type: z.literal("momo"),
  networkId: z.string().min(1, "Choose a network"),
  phone: ghanaPhoneSchema,
});
export type AddMomoMethodFormValues = z.infer<typeof addMomoMethodSchema>;

export const addCardMethodSchema = z.object({
  type: z.literal("card"),
  cardNumber: cardNumberSchema,
  expiry: cardExpirySchema,
  cvv: cardCvvSchema,
});
export type AddCardMethodFormValues = z.infer<typeof addCardMethodSchema>;

export const addPaymentMethodSchema = z.discriminatedUnion("type", [addMomoMethodSchema, addCardMethodSchema]);
export type AddPaymentMethodFormValues = z.infer<typeof addPaymentMethodSchema>;

// ---------------------------------------------------------------------------
// Checkout
// ---------------------------------------------------------------------------

export const checkoutAddressSchema = z.object({
  name: z.string().trim().min(1, "Full name is required"),
  phone: ghanaPhoneSchema,
  city: z.string().trim().min(1, "City or town is required"),
  street: z.string().trim().min(1, "Street address is required"),
  region: regionSchema,
  notes: z.string().trim().optional(),
});
export type CheckoutAddressFormValues = z.infer<typeof checkoutAddressSchema>;

// ---------------------------------------------------------------------------
// Wallet
// ---------------------------------------------------------------------------

export const walletTopUpSchema = z.object({
  amount: z.coerce.number().positive("Enter an amount greater than 0"),
  methodId: z.string().min(1, "Choose a payment method"),
});
export type WalletTopUpFormValues = z.infer<typeof walletTopUpSchema>;
