-- Example seed data for demoing the mobile MVP.
-- Optional: run `SET app.seed_user_id = '<uuid>';` in your session to reuse an existing user.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
    requested_user uuid;
    fallback_user uuid;
BEGIN
    requested_user := NULLIF(current_setting('app.seed_user_id', true), '')::uuid;

    IF requested_user IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = requested_user) THEN
            RAISE EXCEPTION 'app.seed_user_id % does not exist in auth.users. Provide a valid user id.', requested_user;
        END IF;
        PERFORM set_config('app.seed_user_id', requested_user::text, false);
    ELSE
        SELECT id INTO fallback_user FROM auth.users ORDER BY created_at LIMIT 1;
        IF fallback_user IS NULL THEN
            fallback_user := gen_random_uuid();
            INSERT INTO auth.users (
                id,
                instance_id,
                email,
                encrypted_password,
                email_confirmed_at,
                invited_at,
                last_sign_in_at,
                raw_app_meta_data,
                raw_user_meta_data,
                aud,
                role,
                created_at,
                updated_at
            )
            VALUES (
                fallback_user,
                '00000000-0000-0000-0000-000000000000',
                format('demo+seed-%s@nexa.dev', floor(random() * 1000000)::text),
                crypt('SeedPass123!', gen_salt('bf')),
                timezone('utc', now()),
                timezone('utc', now()),
                timezone('utc', now()),
                jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
                '{}'::jsonb,
                'authenticated',
                'authenticated',
                timezone('utc', now()),
                timezone('utc', now())
            );
        END IF;
        PERFORM set_config('app.seed_user_id', fallback_user::text, false);
    END IF;
END $$;

WITH vars AS (
    SELECT
        current_setting('app.seed_user_id')::uuid AS user_id,
        gen_random_uuid() AS project_id,
        gen_random_uuid() AS job_id,
        gen_random_uuid() AS report_id,
        COALESCE(
            (SELECT email FROM auth.users WHERE id = current_setting('app.seed_user_id')::uuid LIMIT 1),
            'demo@nexa.dev'
        ) AS user_email
),
user_upsert AS (
    INSERT INTO public.users (id, email)
    SELECT user_id, user_email
    FROM vars
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email
    RETURNING id
),
project_insert AS (
    INSERT INTO public.projects (id, user_id, title, description, keywords, competitor_urls, platforms)
    SELECT
        vars.project_id,
        vars.user_id,
        'Nexa Growth Pulse',
        'Research community sentiment around Nexa platform outages.',
        ARRAY['nexa', 'outage', 'status page'],
        ARRAY['https://status.nexa.dev'],
        ARRAY['Reddit', 'X']
    FROM vars
    ON CONFLICT (id) DO NOTHING
    RETURNING id
),
job_insert AS (
    INSERT INTO public.jobs (id, user_id, project_id, status, created_at, updated_at, finished_at)
    SELECT
        vars.job_id,
        vars.user_id,
        vars.project_id,
        'completed',
        now() - interval '2 hours',
        now() - interval '1 hour',
        now() - interval '1 hour'
    FROM vars
    ON CONFLICT (id) DO NOTHING
    RETURNING id
),
report_insert AS (
    INSERT INTO public.reports (id, user_id, project_id, job_id, payload_json)
    SELECT
        vars.report_id,
        vars.user_id,
        vars.project_id,
        vars.job_id,
        jsonb_build_object(
            'summary_text', 'Community monitoring indicates heightened concern about Nexa API reliability. Rapid, transparent updates reduce churn risk.',
            'top_subreddits', ARRAY['r/NexaBuilders', 'r/SaaS', 'r/ProductManagement', 'r/Entrepreneurship', 'r/Startups'],
            'top_hashtags', ARRAY['#NexaAPI', '#SaaS', '#DevTools', '#StatusUpdate', '#IncidentResponse'],
            'competitor_snippets', jsonb_build_array(
                jsonb_build_object('source', 'StatusPage.io', 'excerpt', 'Competitors publish five-minute cadence updates during incidents.'),
                jsonb_build_object('source', 'r/SaaS', 'excerpt', 'Founders highlight frustration when outage comms lag behind actual fixes.'),
                jsonb_build_object('source', 'X', 'excerpt', 'Users ask for clearer rollback plans when features misbehave.')
            ),
            'post_drafts', ARRAY[
                'Heads up Nexa builders: we''re rolling a hotfix for API latency. Expect stability in 20 minutes—status updates every 10.',
                'We just shipped new monitoring runbooks for Nexa webhooks. If you saw retries today, they''re resolved and docs are live.',
                'Looking for feedback: what tooling do you rely on to mitigate API downtime? Building a community playbook this week.',
                'PSA: we''re launching a beta status stream. Drop your email if you want real-time Nexa incident summaries.',
                'Friday focus: sharing the 3 steps we take to harden Nexa pipelines after each incident—thread.'
            ],
            'reply_templates', ARRAY[
                'Appreciate you flagging this—can you DM your workspace ID so we confirm the fix reached you?',
                'Thanks for patience! Heads-up: rerun your sync to pick up the recovered events.',
                'We hear you. Working on a changelog postmortem and will loop you in ASAP.',
                'Love this suggestion. Mind if we add it to the public incident playbook for other teams?',
                'Great catch. Logging this to our reliability channel now and will circle back with a timeline.'
            ],
            '7_day_schedule', jsonb_build_array(
                jsonb_build_object('day', 'Monday', 'time', '9:00 AM', 'draft_reference', 'Post Draft #1'),
                jsonb_build_object('day', 'Tuesday', 'time', '2:00 PM', 'draft_reference', 'Post Draft #2'),
                jsonb_build_object('day', 'Wednesday', 'time', '11:00 AM', 'draft_reference', 'Post Draft #3'),
                jsonb_build_object('day', 'Thursday', 'time', '1:00 PM', 'draft_reference', 'Post Draft #4'),
                jsonb_build_object('day', 'Friday', 'time', '10:00 AM', 'draft_reference', 'Post Draft #5')
            ),
            'quick_tactics', ARRAY[
                'Publish 10-minute cadence updates on status.nexa.dev and cross-post to Reddit/X threads.',
                'Open a dedicated AMA after the incident wraps to collect workflow fixes from power users.',
                'Ship a Loom walkthrough showing how to rerun failed jobs once the API stabilizes.'
            ]
        )
    FROM vars
    ON CONFLICT (id) DO NOTHING
    RETURNING id
),
job_update AS (
    UPDATE public.jobs
    SET result_report_id = vars.report_id
    FROM vars
    WHERE public.jobs.id = vars.job_id
    RETURNING public.jobs.id
)
SELECT
    (SELECT user_id FROM vars) AS seed_user_id,
    (SELECT project_id FROM vars) AS project_id,
    (SELECT job_id FROM vars) AS job_id,
    (SELECT report_id FROM vars) AS report_id;
