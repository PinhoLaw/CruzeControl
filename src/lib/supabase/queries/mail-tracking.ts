import { createClient } from "@/lib/supabase";
import type {
  MailTrackingRow,
  MailTrackingInsert,
  MailTrackingUpdate,
} from "@/types/database";

/** Fetch all mail tracking rows for an event, ordered by drop then zip. */
export async function getMailTrackingByEvent(
  eventId: string
): Promise<MailTrackingRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("mail_tracking")
    .select("*")
    .eq("event_id", eventId)
    .order("drop_num", { ascending: true })
    .order("zip_code", { ascending: true });

  if (error) throw error;
  return (data ?? []) as MailTrackingRow[];
}

/** Insert or update a mail tracking row. */
export async function upsertMailTracking(
  row: MailTrackingInsert | MailTrackingUpdate
): Promise<MailTrackingRow> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("mail_tracking")
    .upsert(row, { onConflict: "id" })
    .select("*")
    .single();

  if (error) throw error;
  return data as MailTrackingRow;
}

/** Delete a mail tracking row by id. */
export async function deleteMailTracking(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("mail_tracking")
    .delete()
    .eq("id", id);
  if (error) throw error;
}
