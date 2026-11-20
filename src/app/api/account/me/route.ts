import { getUser, publicUser } from "@/lib/server/users";

export const dynamic = "force-dynamic";

export async function GET() {
  const u = await getUser();
  return Response.json({ user: u ? publicUser(u) : null }, { headers: { "Cache-Control": "no-store" } });
}
