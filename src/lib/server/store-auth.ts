import "server-only";
import { getUser, type User } from "./users";
import { queryOne } from "./db";
import { readPayToken } from "./pay-token";
import { bareHost, currentSite } from "./hosts";
import { getCatalogConfig, getStoreForUser, type Store } from "./catalog";

/** For merchant API routes: the signed-in user and their store, or an error Response. */
export async function requireStoreApi(req?: Request): Promise<{ user: User; store: Store } | Response> {
  let user = await getUser();
  // Plan payment page for stores on their own domain: signed pay-token instead of the login cookie.
  const pay = !user && req ? readPayToken(req.headers.get("x-pay-token")) : null;
  if (pay) {
    const u = await queryOne<User>("SELECT * FROM users WHERE id=? AND status='active'", [pay.u]);
    const st = u ? await getStoreForUser(u.id) : null;
    if (u && st && st.id === pay.s) user = u;
  }
  if (!user) return Response.json({ error: "Please log in." }, { status: 401 });
  if (!(await getCatalogConfig()).features.enabled) return Response.json({ error: "Online stores are paused right now." }, { status: 503 });
  const store = await getStoreForUser(user.id);
  if (!store) return Response.json({ error: "Create your store first." }, { status: 404 });
  // On a store's own domain, seller APIs work only for that domain's owner.
  const site = await currentSite();
  if (site !== "main" && site !== bareHost(store.domain ?? "")) return Response.json({ error: "Manage your store from vishnuit.co.in." }, { status: 403 });
  return { user, store };
}

export const str = (v: unknown, max = 255) => (typeof v === "string" ? v.trim().slice(0, max) : "");
export const num = (v: unknown) => {
  if (v === "" || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null;
};
