import { BadgeCheck, Clock, Gift, Heart, Leaf, MessageCircle, Package, RotateCcw, ShieldCheck, Sparkles, Star, Truck } from "lucide-react";

/** Icons a merchant can pick for the 4 store highlights. Keys match HIGHLIGHT_ICONS on the server. */
export const HIGHLIGHT_ICON_MAP = {
  truck: Truck, shield: ShieldCheck, rotate: RotateCcw, message: MessageCircle, gift: Gift, star: Star,
  sparkles: Sparkles, leaf: Leaf, badge: BadgeCheck, clock: Clock, package: Package, heart: Heart,
} as const;
export type HighlightIconKey = keyof typeof HIGHLIGHT_ICON_MAP;
