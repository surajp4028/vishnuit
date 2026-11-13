import "server-only";
import { createHmac, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { queryOne } from "./db";

export const SESSION_COOKIE = "vit_admin";
const MAX_AGE = 60 * 60 * 12; // 12 hours

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) throw new Error("AUTH_SECRET must be set (32+ chars)");
  return s;
}
const sign = (p: string) => createHmac("sha256", secret()).update(p).digest("base64url");

export function verifyPassword(pw: string, stored: string) {
  const [algo, salt, hex] = stored.split("$");
  if (algo !== "scrypt" || !salt || !hex) return false;
  const a = Buffer.from(hex, "hex");
  const b = scryptSync(pw, salt, a.length);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function createToken(adminId: number, email: string) {
  const payload = Buffer.from(JSON.stringify({ i: adminId, e: email, x: Date.now() + MAX_AGE * 1000 })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function readToken(token?: string | null): { i: number; e: string } | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = sign(payload);
  if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (typeof data.x !== "number" || data.x < Date.now()) return null;
    return { i: data.i, e: data.e };
  } catch {
    return null;
  }
}

export async function setSession(adminId: number, email: string) {
  (await cookies()).set(SESSION_COOKIE, createToken(adminId, email), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

export type Admin = { id: number; email: string; name: string };

export async function getAdmin(): Promise<Admin | null> {
  const t = readToken((await cookies()).get(SESSION_COOKIE)?.value);
  if (!t) return null;
  try {
    return await queryOne<Admin>("SELECT id, email, name FROM admins WHERE id=? AND email=?", [t.i, t.e]);
  } catch {
    return null;
  }
}

export async function requireAdminPage() {
  const a = await getAdmin();
  if (!a) redirect("/admin/login");
  return a;
}

/** For API routes: returns admin or a 401 Response. */
export async function requireAdminApi(): Promise<Admin | Response> {
  const a = await getAdmin();
  return a ?? Response.json({ error: "Unauthorized" }, { status: 401 });
}

// Simple in-memory login rate limiter (per IP).
const attempts = new Map<string, { n: number; t: number }>();
export function rateLimit(key: string, max = 8, windowMs = 10 * 60 * 1000) {
  const now = Date.now();
  const a = attempts.get(key);
  if (!a || now - a.t > windowMs) {
    attempts.set(key, { n: 1, t: now });
    return true;
  }
  a.n++;
  return a.n <= max;
}
