# Admin repository migration

## Scope

This repository extracts only `apps/admin` from the ZinGo monorepo. Mobile, public Web, EAS configuration, Supabase migrations, and unrelated monorepo packages are excluded. The original `apps/admin` remains untouched.

## Extracted dependencies

- Next.js 16.4.3, React 19.3.0, TypeScript 5.9.x.
- `@supabase/ssr`, `@supabase/supabase-js`, and `server-only`.
- `src/lib/shared/database.ts`: the local Supabase `Database` contract and `AppRole` type used by Admin authentication, RPC calls, and subscription/support screens.
- `src/lib/shared/algerian-areas.ts` and its bilingual administrative-area JSON/license: the only runtime data imported from `packages/shared`.

No `workspace:*` dependency remains. No Admin source imports `packages/shared` or files outside this repository.

## Security review

Admin route access is enforced by the protected server layout. `resolveAdminPrincipal` verifies Supabase Auth with `getUser()` and reads `user_roles` using the authenticated session; `assertAdminPrincipal` requires the `admin` role. Sensitive server actions repeat this check before invoking privileged RPCs. Middleware only refreshes cookies and is not treated as the authorization boundary.

No service-role key is used or exposed. Browser code receives only the Supabase public URL/key required by the SSR client. Database RPCs and RLS remain authoritative for privileged operations. No public Admin registration or credential bypass was added.

## Environment variables

Required in Vercel and local server runtime:

- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL; safe to expose to the client.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — Supabase publishable/anon key; safe to expose to the client.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — legacy fallback accepted by the current implementation; use only if publishable keys are not available.

There is no server-only secret variable in the extracted implementation. Do not add a service-role key unless a separately reviewed server-only feature requires it.

## Vercel deployment

- Framework preset: Next.js
- Root directory: repository root
- Install command: `pnpm install --frozen-lockfile`
- Build command: `pnpm build`
- Output: default Next.js output; no custom output directory
- Node.js: 20.x or newer, matching `engines.node >=20.9`
- Configure the required Supabase variables above in the Vercel server/environment scopes.
- Supabase Auth redirect/callback URLs must include the final Vercel Admin origin and local development origin as appropriate. Do not use the public website domain as the Admin deployment domain.

## Validation

From this repository, without the original monorepo workspace:

- `pnpm install --no-optional` — passed (optional foreign-platform SWC packages skipped).
- `pnpm typecheck` — passed.
- `pnpm lint` — passed.
- `pnpm format:check` — passed.
- `pnpm build` — passed; Next.js 16.4.3 generated all listed routes successfully.

No live Supabase data or production settings were changed during validation.

## Known limitations

- Live authentication and RLS behavior require a configured Supabase project and are not exercised by the static build checks.
- Callback origins and the final Admin production hostname are deployment-owner configuration; no production domain is invented here.
- GitHub push is intentionally not performed without explicit approval for establishing the remote branch.
