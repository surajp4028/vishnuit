import "server-only";
import { getUser, type User } from "./users";
import { getCatalogConfig, getStoreForUser, type Store } from "./catalog";

/** For merchant API routes: the signed-in user and their store, or an error Response. */
export async function requireStoreApi(): Promise<{ user: User; store: Store } | Response> {
  const user = await getUser();
  if (!user) return Response.json({ error: "Please log in." }, { status: 401 });
  if (!(await getCatalogConfig()).features.enabled) return Response.json({ error: "Online stores are paused right now." }, { status: 503 });
  const store = await getStoreForUser(user.id);
  if (!store) return Response.json({ error: "Create your store first." }, { status: 404 });
  return { user, store };
}

export const str = (v: unknown, max = 255) => (typeof v === "string" ? v.trim().slice(0, max) : "");
export const num = (v: unknown) => {
  if (v === "" || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null;
};
