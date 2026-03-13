import { createClient } from "@/lib/supabase";
import type {
  InventoryRow,
  InventoryInsert,
  InventoryUpdate,
} from "@/types/database";

/** Fetch all inventory items for an event, ordered by hat_num. */
export async function getInventoryByEvent(
  eventId: string
): Promise<InventoryRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("inventory")
    .select("*")
    .eq("event_id", eventId)
    .order("hat_num", { ascending: true });

  if (error) throw error;
  return (data ?? []) as InventoryRow[];
}

/** Insert or update an inventory item. */
export async function upsertInventoryItem(
  item: InventoryInsert | InventoryUpdate
): Promise<InventoryRow> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("inventory")
    .upsert(item, { onConflict: "id" })
    .select("*")
    .single();

  if (error) throw error;
  return data as InventoryRow;
}

/** Delete an inventory item by id. */
export async function deleteInventoryItem(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("inventory").delete().eq("id", id);
  if (error) throw error;
}
