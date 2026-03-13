import { createClient } from "@/lib/supabase";
import { calcFiTotal, calcTotalGross } from "@/lib/calculations";
import type { DealRow, DealInsert, DealUpdate } from "@/types/database";

/** Fetch all deals for an event, ordered by deal date ascending. */
export async function getDealsByEvent(eventId: string): Promise<DealRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("deals")
    .select("*")
    .eq("event_id", eventId)
    .order("deal_date", { ascending: true });

  if (error) throw error;
  return (data ?? []) as DealRow[];
}

/**
 * Insert or update a deal. Recalculates fi_total and total_gross before write.
 * If deal has an id, updates. Otherwise inserts.
 */
export async function upsertDeal(
  deal: DealInsert | DealUpdate
): Promise<DealRow> {
  const supabase = createClient();

  const fiTotal = calcFiTotal(
    deal.reserve ?? 0,
    deal.warranty ?? 0,
    deal.aft1 ?? 0,
    deal.gap ?? 0
  );
  const totalGross = calcTotalGross(deal.front_gross ?? 0, fiTotal);

  const dbRow = {
    ...deal,
    fi_total: fiTotal,
    total_gross: totalGross,
  };

  const { data, error } = await supabase
    .from("deals")
    .upsert(dbRow, { onConflict: "id" })
    .select("*")
    .single();

  if (error) throw error;
  return data as DealRow;
}

/** Delete a deal by id. */
export async function deleteDeal(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("deals").delete().eq("id", id);
  if (error) throw error;
}
