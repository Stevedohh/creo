# General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->

# Обращение к пользователю

В каждом ответе (как минимум один раз — в начале или в конце) обращайся к пользователю почтительно, чередуя варианты: "Мой господин", "Да, повелитель", "Так точно, мастер", "Слушаюсь, господин", "Как прикажете, повелитель", "К вашим услугам, мастер". Не используй одну и ту же формулу два раза подряд.

# Skills Auto-Routing

Invoke skills proactively based on request intent — do not wait for the user to name them. Match triggers below and call the skill via the Skill tool before exploring or editing.

## Nx workflow

- **`nx-workspace`** — any question about workspace structure, projects, targets, dependencies, tags, or task graph. Use FIRST for "what projects…", "how is X configured", "what depends on Y".
- **`nx-generate`** — ANY scaffolding: creating apps, libs, components, modules, services, configs. Use BEFORE exploring or calling MCP tools.
- **`nx-run-tasks`** — running build/lint/test/serve/e2e or any nx target.
- **`nx-plugins`** — discovering/installing Nx plugins or adding framework support.
- **`nx-import`** — importing/merging external repos into the workspace.
- **`link-workspace-packages`** — after creating packages, resolving cross-package imports, or fixing "cannot find module @creo/*" errors.

## Frontend (React / Next.js / Ant Design)

- **`frontend-patterns`** — React/Next.js component work, state management, performance, UI architecture decisions.
- **`tanstack-query-expert`** — data fetching, mutations, cache, stale time, optimistic updates, SSR with App Router.
- **`design-system-patterns`** — design tokens, theming, component library architecture, building primitives in `libs/ui`.
- **`avinyc-web-design`** — landing pages, hero sections, dashboards, visual design systems, aesthetic direction.
- **`i18n`** — translations, react-i18next, adding languages/keys.
- **`modern-javascript-patterns`** — ES6+ refactors, async/await, functional patterns, legacy JS cleanup.

## Backend (NestJS / Node / Postgres)

- **`nestjs-patterns`** — NestJS modules, controllers, providers, DTOs, guards, interceptors, config.
- **`backend-patterns`** — Node/Express/Next API routes, server architecture, general backend design.
- **`api-design`** — REST resource naming, status codes, pagination, errors, versioning, rate limiting.
- **`postgres-patterns`** — query optimization, schema design, indexing, RLS/security.

## Routing rules

- If multiple skills match, invoke them in parallel where independent (e.g. `nestjs-patterns` + `postgres-patterns` for a new API endpoint with DB work).
- For a new feature spanning frontend + backend, route to both sides without asking.
- Skip skill invocation only for trivial edits (typo, rename, single-line fix) where the skill would add no value.
- Never ask the user which skill to use — infer from the request and proceed.

# Ant Design

- This project uses **Ant Design** as the UI component library
- Full component API documentation is at `docs/antd-llms-full.txt` (59K lines, 73 components)
- **Before writing Ant Design code**, read the relevant component section from that file to ensure correct props and patterns
- Use `grep -n "^## component-name" docs/antd-llms-full.txt` to find the section offset, then read from there
