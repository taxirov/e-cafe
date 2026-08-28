import { z } from "zod";

export const phoneSchema = z
  .string()
  .regex(/^\+998\d{9}$/, "Telefon raqam +998XXXXXXXXX formatida bo'lishi kerak");

/** Letters (any script), digits, spaces, apostrophe variants (o', g'), and hyphens. */
export const NAME_CHARS_REGEX = /^[\p{L}\p{N}\s'‘’ʻʼ-]+$/u;
export const NAME_CHARS_HINT =
  "Nomda faqat harflar, raqamlar, bo'sh joy, apostrof (') va tire (-) belgilaridan foydalaning";

export const slugSchema = z
  .string()
  .min(3, "Manzil kamida 3 ta belgidan iborat bo'lishi kerak")
  .max(40, "Manzil 40 ta belgidan oshmasligi kerak")
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Manzil faqat kichik lotin harflari, raqam va tire (-) dan iborat bo'lishi mumkin");

export const registerCafeSchema = z.object({
  fullName: z.string().min(2, "Ism kamida 2 ta belgidan iborat bo'lishi kerak"),
  phone: phoneSchema,
  password: z.string().min(6, "Parol kamida 6 ta belgidan iborat bo'lishi kerak"),
  cafeName: z
    .string()
    .min(2, "Kafe nomi kamida 2 ta belgidan iborat bo'lishi kerak")
    .regex(NAME_CHARS_REGEX, NAME_CHARS_HINT),
});
export type RegisterCafeInput = z.infer<typeof registerCafeSchema>;

export const loginSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(1, "Parol kiritilishi shart"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const inviteStaffSchema = z.object({
  fullName: z.string().min(2, "Ism kamida 2 ta belgidan iborat bo'lishi kerak"),
  phone: phoneSchema,
  password: z.string().min(6, "Parol kamida 6 ta belgidan iborat bo'lishi kerak"),
  role: z.enum(["WAITER", "KITCHEN"]),
});
export type InviteStaffInput = z.infer<typeof inviteStaffSchema>;

/** Global, Super-Admin-managed menu section — shared by every cafe. */
export const menuCategorySchema = z.object({
  name: z.string().min(1, "Nomi kiritilishi shart").max(60, "Nom 60 ta belgidan oshmasligi kerak"),
});
export type MenuCategoryInput = z.infer<typeof menuCategorySchema>;

/** Shared/global dish fields (name, category, description, photo) — same across every cafe that lists it. */
export const dishSchema = z.object({
  name: z.string().min(1, "Nomi kiritilishi shart").max(100, "Nom 100 ta belgidan oshmasligi kerak"),
  categoryId: z.string().min(1, "Kategoriya tanlanishi shart"),
  description: z.string().max(500, "Tavsif 500 ta belgidan oshmasligi kerak").optional().nullable(),
  imageUrl: z.string().optional().nullable(),
});
export type DishInput = z.infer<typeof dishSchema>;

/** A cafe's own listing of a dish — either an existing catalog dish (dishId) or a brand-new one (newDish), never both. */
export const menuItemSchema = z
  .object({
    dishId: z.string().optional().nullable(),
    newDish: dishSchema.optional().nullable(),
    price: z.coerce.number().positive("Narx musbat bo'lishi kerak"),
    prepTimeMin: z.coerce.number().int().min(0).optional().nullable(),
    isAvailable: z.coerce.boolean().default(true),
  })
  .refine((d) => Boolean(d.dishId) !== Boolean(d.newDish), {
    message: "Mavjud taomni tanlang yoki yangisini yarating",
    path: ["dishId"],
  });
export type MenuItemInput = z.infer<typeof menuItemSchema>;

export const menuItemVariantSchema = z.object({
  name: z.string().min(1, "Nomi kiritilishi shart").max(40, "Nom 40 ta belgidan oshmasligi kerak"),
  price: z.coerce.number().positive("Narx musbat bo'lishi kerak"),
});
export type MenuItemVariantInput = z.infer<typeof menuItemVariantSchema>;

export const tableSchema = z.object({
  label: z.string().min(1, "Stol nomi/raqami kiritilishi shart").max(30, "30 ta belgidan oshmasligi kerak"),
});
export type TableInput = z.infer<typeof tableSchema>;

const optionalUrl = z
  .string()
  .optional()
  .nullable()
  .refine((v) => !v || /^https?:\/\//i.test(v), "Havola https:// bilan boshlanishi kerak");

const optionalPhone = z
  .string()
  .optional()
  .nullable()
  .refine((v) => !v || /^\+998\d{9}$/.test(v), "Telefon raqam +998XXXXXXXXX formatida bo'lishi kerak");

export const updateCafeIdentitySchema = z.object({
  name: z.string().min(2, "Kafe nomi kamida 2 ta belgidan iborat bo'lishi kerak"),
  description: z.string().max(500, "Tavsif 500 ta belgidan oshmasligi kerak").optional().nullable(),
  slug: slugSchema,
  logoUrl: optionalUrl,
  bannerUrl: optionalUrl,
});
export type UpdateCafeIdentityInput = z.infer<typeof updateCafeIdentitySchema>;

export const updateCafeContactSchema = z.object({
  address: z.string().max(300, "Manzil 300 ta belgidan oshmasligi kerak").optional().nullable(),
  locationUrl: optionalUrl,
  workingHours: z.string().max(200, "Ish vaqti 200 ta belgidan oshmasligi kerak").optional().nullable(),
  contactPhone: optionalPhone,
  instagramUrl: optionalUrl,
  telegramUrl: optionalUrl,
  deliveryFee: z.coerce.number().min(0, "Manfiy bo'lishi mumkin emas").default(0),
  minOrderTotal: z.coerce.number().min(0, "Manfiy bo'lishi mumkin emas").default(0),
});
export type UpdateCafeContactInput = z.infer<typeof updateCafeContactSchema>;

export const cartLineSchema = z.object({
  menuItemId: z.string(),
  variantId: z.string().optional().nullable(),
  qty: z.number().int().positive(),
  note: z.string().max(200).optional().nullable(),
});
export type CartLine = z.infer<typeof cartLineSchema>;

export const ORDER_TYPES = ["DINE_IN", "DELIVERY", "PICKUP"] as const;

/** Placed by a guest — either via QR (tableToken set) or the cafe's public delivery/pickup page. */
export const placeGuestOrderSchema = z
  .object({
    cafeId: z.string(),
    type: z.enum(ORDER_TYPES),
    tableToken: z.string().optional().nullable(),
    items: z.array(cartLineSchema).min(1, "Kamida bitta taom tanlang"),
    customerName: z.string().max(80).optional().nullable(),
    customerPhone: z.string().optional().nullable(),
    address: z.string().max(300).optional().nullable(),
    note: z.string().max(300).optional().nullable(),
  })
  .refine((d) => d.type !== "DINE_IN" || Boolean(d.tableToken), {
    message: "Stol aniqlanmadi — QR kodni qaytadan skanerlang",
    path: ["tableToken"],
  })
  .refine((d) => d.type === "DINE_IN" || Boolean(d.address || d.type === "PICKUP"), {
    message: "Yetkazib berish manzilini kiriting",
    path: ["address"],
  });
export type PlaceGuestOrderInput = z.infer<typeof placeGuestOrderSchema>;

/** Entered by a waiter at the table via POS. */
export const placeStaffOrderSchema = z.object({
  tableId: z.string().min(1, "Stol tanlanishi shart"),
  items: z.array(cartLineSchema).min(1, "Kamida bitta taom tanlang"),
  note: z.string().max(300).optional().nullable(),
});
export type PlaceStaffOrderInput = z.infer<typeof placeStaffOrderSchema>;

export const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "SERVED",
  "COMPLETED",
  "CANCELLED",
] as const;
export type OrderStatusValue = (typeof ORDER_STATUSES)[number];
