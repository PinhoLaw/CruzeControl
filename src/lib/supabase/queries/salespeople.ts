import { createClient } from "@/lib/supabase";
import type {
  SalespersonRow,
  SalespersonInsert,
  SalespersonUpdate,
} from "@/types/database";

/** Fetch all salespeople/managers/team leaders for an event. */
export async function getSalespeopleByEvent(
  eventId: string
): Promise<SalespersonRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("salespeople")
    .select("*")
    .eq("event_id", eventId)
    .order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []) as SalespersonRow[];
}

/** Insert or update a salesperson. */
export async function upsertSalesperson(
  sp: SalespersonInsert | SalespersonUpdate
): Promise<SalespersonRow> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("salespeople")
    .upsert(sp, { onConflict: "id" })
    .select("*")
    .single();

  if (error) throw error;
  return data as SalespersonRow;
}

/** Delete a salesperson by id. */
export async function deleteSalesperson(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("salespeople").delete().eq("id", id);
  if (error) throw error;
}
