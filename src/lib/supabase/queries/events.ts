import { createClient } from "@/lib/supabase";
import type { EventRow, EventInsert, EventUpdate } from "@/types/database";

/** Fetch a single event by ID. */
export async function getEvent(eventId: string): Promise<EventRow | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .single();

  if (error) throw error;
  return data as EventRow | null;
}

/** Create a new event. Returns the created row. */
export async function createEvent(event: EventInsert): Promise<EventRow> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("events")
    .insert(event)
    .select("*")
    .single();

  if (error) throw error;
  return data as EventRow;
}

/** Update an event. Only sends changed fields. */
export async function updateEvent(event: EventUpdate): Promise<EventRow> {
  const supabase = createClient();
  const { id, ...fields } = event;

  const { data, error } = await supabase
    .from("events")
    .update(fields)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return data as EventRow;
}
