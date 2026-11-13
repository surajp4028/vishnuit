import {
  Blocks, Building2, Code2, FileSearch, Gauge, Gem, GraduationCap, Link2, Megaphone, MousePointerClick, Palette,
  PenTool, Printer, Rocket, Search, Share2, ShoppingBag, Smartphone, Sparkles, Target, type LucideIcon,
} from "lucide-react";

export const ICONS: Record<string, LucideIcon> = {
  Blocks, Building2, Code2, FileSearch, Gauge, Gem, GraduationCap, Link2, Megaphone, MousePointerClick, Palette,
  PenTool, Printer, Rocket, Search, Share2, ShoppingBag, Smartphone, Sparkles, Target,
};
export const ICON_NAMES = Object.keys(ICONS);

export function Icon({ name, className }: { name: string; className?: string }) {
  const C = ICONS[name] ?? Sparkles;
  return <C className={className} />;
}
