# Edge Functions — What Goes Where

## Philosophy

Client should do UI + supabase-js calls with anon key.
Edge Functions should handle:

- server-only secrets
- event tracking
- notification fanout (if implemented)
- validation when needed

## Current / planned functions

1. track-event

- Purpose: central analytics/event tracking
- Inputs: { event_name, properties, user_id? }
- Auth: allow anon but validate payload shape
- Output: { ok: true }

2. chat-completion (if present in repo)

- Purpose: AI chat / content generation (if relevant)
- Auth: require authenticated user
- Output: structured JSON response

## Notification strategy (stretch)

- Preferred: Web Push + Service Worker
- Fallback: in-app notification banners / feed item insertion

## Logging

All functions must:

- log structured errors
- return consistent JSON error shape:
  { ok: false, error: { code, message } }
