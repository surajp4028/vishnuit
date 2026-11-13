import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ light, dark, name, className }: { light: string; dark: string; name: string; className?: string }) {
  return (
    <Link href="/" aria-label={`${name} — home`} className={cn("relative inline-flex h-10 w-[130px] shrink-0 items-center", className)}>
      <Image src={light} alt={name} fill priority sizes="130px" className="object-contain object-left dark:hidden" />
      <Image src={dark} alt={name} fill priority sizes="130px" className="hidden object-contain object-left dark:block" />
    </Link>
  );
}
