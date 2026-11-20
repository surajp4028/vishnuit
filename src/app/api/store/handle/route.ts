import { queryOne } from "@/lib/server/db";
import { handleProblem } from "@/lib/server/catalog";

/** Live "is this store link free?" check. */
export async function GET(req: Request) {
  const h = (new URL(req.url).searchParams.get("h") ?? "").toLowerCase().replace(/^@/, "");
  const problem = handleProblem(h);
  if (problem) return Response.json({ ok: false, error: problem });
  const taken = await queryOne("SELECT id FROM stores WHERE handle=?", [h]);
  return Response.json(taken ? { ok: false, error: "Already taken. Try another." } : { ok: true });
}
