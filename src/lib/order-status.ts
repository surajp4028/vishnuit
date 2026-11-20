/** Order + payment statuses shared by the seller panel, the API and the customer's My Orders. */
export const ORDER_FLOW = ["new", "confirmed", "processing", "packed", "shipped", "out_for_delivery", "delivered"] as const;
export const ORDER_END = ["cancelled", "returned"] as const;
export const ORDER_STATUSES = [...ORDER_FLOW, ...ORDER_END] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_LABEL: Record<string, string> = {
  new: "Order placed", confirmed: "Confirmed", processing: "Processing", packed: "Packed", shipped: "Shipped",
  out_for_delivery: "Out for delivery", delivered: "Delivered", cancelled: "Cancelled", returned: "Returned",
};
export const ORDER_COLOR: Record<string, string> = {
  new: "bg-blue-500/10 text-blue-600", confirmed: "bg-violet-500/10 text-violet-600", processing: "bg-indigo-500/10 text-indigo-600",
  packed: "bg-cyan-500/10 text-cyan-700", shipped: "bg-amber-500/10 text-amber-600", out_for_delivery: "bg-orange-500/10 text-orange-600",
  delivered: "bg-emerald-500/10 text-emerald-600", cancelled: "bg-red-500/10 text-red-500", returned: "bg-rose-500/10 text-rose-600",
};

export const PAY_STATUSES = ["pending", "paid", "verified", "failed", "refunded"] as const;
export const PAY_LABEL: Record<string, string> = { pending: "Payment pending", paid: "Paid", verified: "Paid · verified", failed: "Payment failed", refunded: "Refunded" };
export const PAY_COLOR: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-600", paid: "bg-emerald-500/10 text-emerald-600", verified: "bg-emerald-500/10 text-emerald-600",
  failed: "bg-red-500/10 text-red-500", refunded: "bg-slate-500/10 text-slate-600",
};

export type StatusLog = { s: string; at: string }[];
export type Tracking = { courier: string; number: string; url: string };
