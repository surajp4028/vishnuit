import { notFound } from "next/navigation";
import { query } from "@/lib/server/db";
import { getCollection, fromRow } from "@/lib/server/admin-crud";
import { CollectionManager } from "@/components/admin/collection-manager";

export async function generateMetadata({ params }: { params: Promise<{ collection: string }> }) {
  return { title: getCollection((await params).collection)?.label ?? "Content" };
}

export default async function CollectionPage({ params }: { params: Promise<{ collection: string }> }) {
  const c = getCollection((await params).collection);
  if (!c) notFound();
  const rows = await query(`SELECT * FROM ${c.table} ORDER BY ${c.orderBy}`);
  return <CollectionManager collectionKey={c.key} initial={rows.map((r) => fromRow(c, r))} />;
}
