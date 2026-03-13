-- Alter monetary columns in deals table from int to numeric to support decimal values (cents)
ALTER TABLE public.deals ALTER COLUMN cost TYPE numeric USING cost::numeric;
ALTER TABLE public.deals ALTER COLUMN acv TYPE numeric USING acv::numeric;
ALTER TABLE public.deals ALTER COLUMN payoff TYPE numeric USING payoff::numeric;
ALTER TABLE public.deals ALTER COLUMN front_gross TYPE numeric USING front_gross::numeric;
ALTER TABLE public.deals ALTER COLUMN reserve TYPE numeric USING reserve::numeric;
ALTER TABLE public.deals ALTER COLUMN warranty TYPE numeric USING warranty::numeric;
ALTER TABLE public.deals ALTER COLUMN aft1 TYPE numeric USING aft1::numeric;
ALTER TABLE public.deals ALTER COLUMN gap TYPE numeric USING gap::numeric;
ALTER TABLE public.deals ALTER COLUMN fi_total TYPE numeric USING fi_total::numeric;
ALTER TABLE public.deals ALTER COLUMN total_gross TYPE numeric USING total_gross::numeric;

-- Recreate the trigger function to work with numeric types
CREATE OR REPLACE FUNCTION public.recalc_deal_totals()
RETURNS trigger AS $$
BEGIN
  NEW.fi_total := COALESCE(NEW.reserve, 0) + COALESCE(NEW.warranty, 0) + COALESCE(NEW.aft1, 0) + COALESCE(NEW.gap, 0);
  NEW.total_gross := COALESCE(NEW.front_gross, 0) + NEW.fi_total;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
