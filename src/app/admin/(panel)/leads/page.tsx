import { query } from "@/lib/server/db";
import { LeadsTable, type Lead } from "@/components/admin/leads-table";

export const metadata = { title: "Leads & Conversions" };

export default async function LeadsPage() {
  const leads = await query<Lead>("SELECT id,name,email,phone,service,budget,city,message,source,page,utm,status,notes,emailed,created_at FROM leads ORDER BY id DESC LIMIT 1000");
  return <LeadsTable initial={leads.map((l) => ({ ...l, emailed: Number(l.emailed) }))} />;
}
