import { endSession } from "@/lib/server/users";

export async function POST() {
  await endSession();
  return Response.json({ ok: true });
}
