-- These tables are accessed through Spring's JWT-authenticated API, not PostgREST.
-- The deployment JDBC role is postgres (BYPASSRLS). Local table owners also
-- retain access because FORCE ROW LEVEL SECURITY is intentionally not enabled.
-- Do not add auth.uid() policies: application user IDs are not Supabase Auth IDs.
ALTER TABLE public.account_cart_entry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cooking_diary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diary_progress ENABLE ROW LEVEL SECURITY;

-- RLS does not protect TRUNCATE; revoke privileges as well as enabling RLS.
REVOKE ALL PRIVILEGES ON TABLE
    public.account_cart_entry,
    public.cooking_diary,
    public.diary_progress
FROM PUBLIC;

REVOKE ALL PRIVILEGES ON SEQUENCE
    public.account_cart_entry_id_seq,
    public.cooking_diary_id_seq
FROM PUBLIC;

-- Supabase roles do not exist in a plain local PostgreSQL installation.
-- Check their existence so the same migration works in both environments.
DO $$
DECLARE
    api_role TEXT;
BEGIN
    FOREACH api_role IN ARRAY ARRAY['anon', 'authenticated']
    LOOP
        IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = api_role) THEN
            EXECUTE format(
                'REVOKE ALL PRIVILEGES ON TABLE public.account_cart_entry, public.cooking_diary, public.diary_progress FROM %I',
                api_role
            );
            EXECUTE format(
                'REVOKE ALL PRIVILEGES ON SEQUENCE public.account_cart_entry_id_seq, public.cooking_diary_id_seq FROM %I',
                api_role
            );
        END IF;
    END LOOP;
END;
$$;

-- No permissive policies are created. anon/authenticated have no direct access.
-- service_role remains privileged; its secret must never be exposed to clients.
