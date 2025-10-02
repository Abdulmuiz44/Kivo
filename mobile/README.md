# Kivo Mobile (Expo React Native)

This Expo-based Android client lets Nexa operators authenticate with Supabase, create research projects, enqueue Grok-4 jobs, view generated Quick Research Reports, export the JSON payload, and forward the report to Nexa.

## Prerequisites

- Node.js 18+ and npm 9+
- Expo CLI (`npx expo`) and Android SDK/Emulator (for local device testing)
- Supabase project with Auth + Postgres access
- XAI Grok-4 API key

## Environment Variables

Set these in a `.env` file at the repository root (the Expo config reads them via `app.config.js`). Avoid committing secrets.

| Variable | Description |
| --- | --- |
| `SUPABASE_URL` | Supabase project REST URL |
| `SUPABASE_ANON_KEY` | Supabase anon key used by the mobile client |
| `SUPABASE_SERVICE_KEY` | Service role key (Edge function only) |
| `XAI_API_KEY` | Grok-4 API key for the Supabase Edge Function |
| `NEXA_API_URL` | HTTPS endpoint to forward finalized reports |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Optional email export credentials (reserved for future use) |

Run `npx expo start` only after the required variables are set; otherwise the app will throw on boot because Supabase credentials are missing.

## Supabase Setup

1. Apply schema migrations:
   ```sql
   -- from repository root
   psql $SUPABASE_URL < supabase/schema.sql
   ```
   This creates `projects`, `jobs`, `reports`, RLS policies, and helper triggers.

2. (Optional) Seed demo data for presentations:
   ```sql
   psql $SUPABASE_URL < supabase/seed.sql --set "user_id=YOUR_AUTH_USER_ID"
   ```

3. Deploy the Edge Function:
   ```bash
   supabase functions deploy generateReport --project-ref <your-ref> --no-verify-jwt
   ```
   Provide `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `XAI_API_KEY` as environment variables for the function (Dashboard → Functions → generateReport → Settings).

4. Enable Realtime on the `jobs` table (Database → Replication → Set up → choose `jobs`).

## Local Development

```bash
cd mobile
npm install
npx expo start
```

- Sign in with a magic link (Supabase Auth must be configured to send emails).
- Create a project, then tap **Generate Quick Report**. The app inserts a job, invokes the `generateReport` edge function, and subscribes to job updates.
- When a report is ready, the app navigates to the report viewer and allows export/send actions.

### Linting

```bash
npx expo lint
```

## Android APK (local testing)

Use the managed workflow to produce a debug or release APK:

```bash
npx expo run:android --variant release
```

The command generates `android/app/build/outputs/apk/release/app-release.apk`. Share this file for Nexa QA installs.

## Report Export & Nexa Integration

- **Export JSON**: Shares the Grok-4 JSON payload directly from the device.
- **Send to Nexa**: `POST` request to `NEXA_API_URL` with `{ report_id, project_id, payload }`. Ensure the endpoint returns `200`/`202` (queued) to satisfy the MVP acceptance checks.

## CI Notes

- Minimal CI can run `npm install` and `npx expo lint` in the `mobile` directory.
- Ensure secrets are supplied through the CI environment; never commit them.
