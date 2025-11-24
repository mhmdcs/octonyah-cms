# Thmanyah Programs Platform (NestJS)

Backend for a two-component system:

1. **Task 1 – Internal CMS** for editors to curate visual programs (video podcasts, documentaries).
2. **Task 2 – Discovery System** that exposes curated content to end users with powerful search.

This repository hosts the NestJS/TypeScript services, following strict module boundaries, SOLID design, and scalability requirements (≥10M user traffic per hour).

## Current Status

- ✅ Git + base NestJS scaffold
- ✅ CMS architecture & initial folder structure defined
- ⏳ Implementation of CMS modules (Programs, Taxonomy, Imports, Assets)
- ⏳ Discovery system & search integration

Read the detailed architecture plan in `docs/cms-architecture.md`.

## Stack

- Node.js 20+, NestJS 11, TypeScript
- PostgreSQL + TypeORM
- Redis (cache + BullMQ queues)
- OpenSearch/Elasticsearch (planned for Task 2)

## Project Setup

```bash
npm install
```

## Run the API

```bash
# development
npm run start
# watch mode
npm run start:dev
# production
npm run start:prod
```

## Tests

```bash
npm run test         # unit
npm run test:e2e     # e2e
npm run test:cov     # coverage
```

## Directory Intent

- `src/modules/cms/**` – CMS feature modules (programs, taxonomy, imports, assets).
- `src/modules/shared/**` – cross-cutting concerns (database, cache, messaging, utils).
- `docs/cms-architecture.md` – living design document for Task 1.
- `.cursor/` – internal requirements and technical report (ignored by git).

## Conventions

- Commit messages: lowercase, concise (e.g., `scaffold cms folders`).
- Prefer composition over inheritance, keep modules decoupled.
- Document reasoning in `docs/` before implementing major features.
