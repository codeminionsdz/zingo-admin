# ZinGo Admin

Standalone Next.js administrative dashboard for ZinGo. This repository contains only the extracted Admin application and the local shared database and Algerian-area modules it requires.

## Local development

```powershell
pnpm install
Copy-Item .env.example .env.local
pnpm dev
```

Validation commands:

```powershell
pnpm typecheck
pnpm lint
pnpm format:check
pnpm build
```

Admin access is server-authorized. Supabase Auth identity is revalidated on the server and the `admin` role is read through the authenticated Supabase session/RLS path. There is no Admin registration flow and no service-role client. Never place a service-role secret in `NEXT_PUBLIC_*` variables.

See [docs/operations/ADMIN_REPOSITORY_MIGRATION.md](docs/operations/ADMIN_REPOSITORY_MIGRATION.md) for extraction scope, security review, deployment settings, and validation evidence.
