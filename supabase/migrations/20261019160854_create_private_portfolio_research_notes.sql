-- Archive internal portfolio research separately from visitor-facing event descriptions.
-- This private schema is outside the site's public Data API.
CREATE TABLE private.portfolio_research_notes (
  portfolio_entry_id uuid PRIMARY KEY REFERENCES public.portfolio_entries(id) ON DELETE CASCADE,
  event_name_snapshot text NOT NULL,
  event_year_snapshot integer NOT NULL,
  research_notes text NOT NULL,
  archived_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE private.portfolio_research_notes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE private.portfolio_research_notes FROM PUBLIC, anon, authenticated;
