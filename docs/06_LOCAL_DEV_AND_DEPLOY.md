# Local Dev & Deploy Guardrails

## Environment variables (frontend)

- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY
- VITE_POSTHOG_KEY
- VITE_SENTRY_DSN

## Local dev

- Install deps: npm i
- Run: npm run dev
- Build: npm run build
- Preview: npm run preview

## Supabase CLI

Use npx (preferred, avoids PATH issues):

- npx supabase --version
- npx supabase login
- npx supabase link --project-ref <ref>
- npx supabase functions deploy <name>

## Deployment (Cloudflare Pages)

- Set env vars in Cloudflare Pages > Project > Settings > Environment Variables
- Build command: npm run build
- Output directory: dist

## Security reminders

- Never add service role key to Cloudflare Pages env for client usage.
- Service role key only allowed in local scripts or Edge Functions (server-side).
