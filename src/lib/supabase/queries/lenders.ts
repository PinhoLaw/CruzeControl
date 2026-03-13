import { createClient } from "@/lib/supabase";
import type { LenderRow, LenderInsert, LenderUpdate } from "@/types/database";

/** Fetch all lenders for an event. */
export async function getLendersByEvent(
  eventId: string
): Promise<LenderRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("lenders")
    .select("*")
    .eq("event_id", eventId)
    .order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []) as LenderRow[];
}

/** Bulk-insert lenders for an event. */
export async function bulkInsertLenders(
  eventId: string,
  names: string[]
): Promise<void> {
  const supabase = createClient();
  const rows = names.map((name) => ({ event_id: eventId, name }));
  const { error } = await supabase.from("lenders").insert(rows);
  if (error) throw error;
}

/** Insert or update a lender. */
export async function upsertLender(
  lender: LenderInsert | LenderUpdate
): Promise<LenderRow> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("lenders")
    .upsert(lender, { onConflict: "id" })
    .select("*")
    .single();

  if (error) throw error;
  return data as LenderRow;
}

/** Delete a lender by id. */
export async function deleteLender(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("lenders").delete().eq("id", id);
  if (error) throw error;
}
