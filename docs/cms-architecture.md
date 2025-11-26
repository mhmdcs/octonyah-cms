# Task 1 – CMS Architecture

## Goals

- Provide an internal, high-availability API for editors to manage visual programs (video podcasts, documentaries).
- Capture rich metadata (title, description, category, language, duration, publication date) with validation and auditability.
- Keep the system extensible for future ingestion pipelines and downstream discovery/search features.

## Technology Decisions

- **NestJS + TypeScript** for modular, testable server architecture.
- **PostgreSQL** (via TypeORM) as the primary relational store for programs, taxonomy data, and import jobs.
- **Redis** for caching frequently accessed taxonomies and as the backing store for message queues (BullMQ) that process long-running import tasks.
- **Object Storage (S3 compatible)** reference for thumbnails and media metadata (binary assets themselves stay outside the core DB).
- **OpenSearch/Elasticsearch** to be introduced later for Discovery (Task 2); CMS publishes change events for the indexer to consume.

## Logical Components

| Component | Responsibility |
| --- | --- |
| `Programs` | CRUD for visual programs, validation, ownership rules, publication workflow hooks. |
| `Taxonomy` | Manage categories, languages, and other controlled vocabularies. |
| `Imports` | Orchestrate data ingestion from CSV/YouTube/API feeds; normalize into Program entities. |
| `Assets` | Track poster images, trailers, and links to CDN objects. |
| `Shared` | Cross-cutting concerns (persistence, messaging, configuration, tracing, guards). |

## Folder Structure (initial)

```
src/
  config/               # configuration factories (db, redis, queues)
  modules/
    cms/
      cms.module.ts     # aggregates CMS sub-modules
      programs/
        dto/
        entities/
        repositories/
        programs.controller.ts
        programs.module.ts
        programs.service.ts
      taxonomy/
        dto/
        entities/
        taxonomy.controller.ts
        taxonomy.module.ts
        taxonomy.service.ts
      imports/
        dto/
        entities/
        jobs/           # BullMQ processors
        imports.controller.ts
        imports.module.ts
        imports.service.ts
      assets/
        dto/
        entities/
        assets.controller.ts
        assets.module.ts
        assets.service.ts
    shared/
      database/
        database.module.ts
        ormconfig.ts
      cache/
      messaging/
      utils/
```

Each module follows a **Ports & Adapters** layout:

- `dto/` – transport/validation schemas for incoming/outgoing payloads.
- `entities/` – domain objects & TypeORM entities.
- `repositories/` – abstraction over persistence.
- `services/` – application use cases coordinated per module.
- `controller.ts` – REST interface for the CMS UI integration.

## Request Lifecycle (Program creation)

1. CMS UI calls `POST /cms/programs`.
2. `ProgramsController` validates DTOs (class-validator) and calls `ProgramsService`.
3. `ProgramsService` applies business rules (e.g., category must exist, duration cap) and calls a repository.
4. Repository writes to PostgreSQL inside a transaction.
5. Domain event emitted (`ProgramCreatedEvent`) and pushed to Redis queue for:
   - search indexing (Task 2)
   - analytics/audit logs
6. Response returns the created program with metadata and import status.

## Scalability & Reliability Notes

- **Stateless API pods** behind a load balancer; horizontal scaling handles 10M user/hour traffic.
- **Connection pooling** through `pgBouncer` or RDS proxy to keep DB healthy.
- **Caching** of taxonomy lookups and published programs reduces DB read pressure.
- **Queue-backed imports** decouple ingestion from request/response cycle and allow replay.
- **Tracing & logging** via OpenTelemetry exporters for monitoring ingestion throughput and editor actions.

## Next Steps

1. Scaffold the described folder structure and empty module shells.
2. Implement shared infrastructure modules (database, cache, queue).
3. Build CRUD flows for Programs & Taxonomy with validation.
4. Add import job orchestration pipelines.
5. Document APIs and add e2e tests per module.


