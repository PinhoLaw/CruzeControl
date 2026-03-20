CREATE TABLE IF NOT EXISTS feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id),
  page text,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);
