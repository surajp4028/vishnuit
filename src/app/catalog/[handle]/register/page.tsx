import { safeNextPath } from "@/lib/safe-next";
import { googleLoginOn } from "@/lib/server/content";
import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { getStoreByHandle, imgUrl, storeBase } from "@/lib/server/catalog";
import { getUser } from "@/lib/server/users";
import { RegisterForm } from "@/components/account/auth-forms";
import { StoreAuthShell } from "@/components/catalog/store-auth";

export const metadata: Metadata = { title: "Create account", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function StoreRegister({ params, searchParams }: { params: Promise<{ handle: string }>; searchParams: Promise<{ next?: string }> }) {
  const [{ handle }, { next }] = await Promise.all([params, searchParams]);
  const s = await getStoreByHandle(handle);
  if (!s) notFound();
  const base = storeBase(handle, s.handle);
  if (await getUser()) redirect(safeNextPath(next, `${base}/account`));
  return (
    <StoreAuthShell store={s.name} base={base} logo={imgUrl(s.logo_key)} title="Create your account" subtitle={`Faster checkout and order tracking at ${s.name}.`}>
      <Suspense><RegisterForm base={base} google={await googleLoginOn()} /></Suspense>
    </StoreAuthShell>
  );
}
