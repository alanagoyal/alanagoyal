# App Content

This doc defines what belongs in code, what belongs in Supabase, and how to migrate apps one by one without turning the site into a CMS.

## Goal

Keep personal authored content out of the open-source repo when possible, while keeping app behavior simple and resilient.

## Decision Rule

Use this rule first:

- Keep content in code when it is a product default, app behavior, or deterministic generation logic.
- Move content to Supabase when it is clearly authored site content or personal world-building.
- Keep playful per-user state in local/session storage unless there is a real need to sync or publish it.
- Keep real app data in app-specific tables when the app already has a natural data model.

## What Stays In Code

- Weather default cities and other obvious defaults
- Settings defaults and app configuration defaults
- Calendar generation logic, holiday rules, and structural calendar defaults
- Fallback content used when remote content is missing

## What Moves To Supabase

- Messages seed contacts, bios, prompts, and starter conversations
- Calendar personal seed inputs such as:
  - recurring personal event templates
  - restaurant lists
  - special locations
  - hand-authored seeded events or notes that shape the demo world

## What Does Not Move

- Notes and Photos should stay on their existing app-specific Supabase models
- Local toy state should not be moved just for consistency

## Implementation Rules

- Do not commit personal payloads in migrations or seed files.
- Migrations may create app-specific tables/functions, but real personal content should be inserted directly in Supabase outside the repo.
- Every remote content key must have a code fallback so the app still renders without seeded data.
- Prefer app-specific storage over a generic cross-app content bucket.
- Migrate one app at a time. Do not introduce unused generic infrastructure.

## Migration Order

1. Land this policy doc and keep Weather on code defaults.
2. Migrate Messages seed content to Supabase.
3. Migrate Calendar personal seed inputs to Supabase while keeping the generator in code.
4. Re-evaluate after those two apps before broadening the pattern.

## Current Implementation

- Messages now uses app-specific public seed tables with code fallbacks:
  - `messages_seed_contacts`
  - `messages_seed_conversations`
- The migration creates schema only. Personal payloads should be inserted directly in Supabase, not committed in the repo.

## Notes On Scope

This is a personal website, not a multi-tenant product. Prefer the smallest system that keeps personal content out of the repo and preserves a fun interactive experience.
