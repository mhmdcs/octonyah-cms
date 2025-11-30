# Octonyah CMS & Discovery System

## Technical Report

This README document serves as the technical report for the Octonyah CMS & Discovery System. It provides comprehensive documentation on how to run and use the system, the architecture and technology stack, design decisions, challenges faced during implementation, and suggestions for future improvements.

---

Octonyah (totally unrelated to any \*\*\*\*nyah similar sounding cms products!) is a two-component system built with NestJS and TypeScript for managing and discovering programs like video podcasts and documentaries, and potentially others. All integrated into a monorepo that hosts two independent microservices—`cms-service` and `discovery-service`—plus a shared library to reuse shared code and logic.

## Table of Contents

- [Features](#features)
- [Service Layout](#service-layout)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Architecture](#architecture)
- [System Design](#system-design)

## Features

### Content Management System (CMS)
- CRUD operations for programs (video podcasts and documentaries)
- Metadata management (title, description, category, language, duration, publication date)
- Media file management (video and thumbnail images) via MinIO/S3-compatible storage
- File upload endpoints for videos and thumbnails
- Automatic cleanup of media files when programs are deleted or updated
- Input validation and error handling
- RESTful API endpoints for frontend integration
- Swagger documentation
- JWT auth + RBAC (admin, editor) for CMS-only endpoints
- Health check endpoints for monitoring and orchestration

### Discovery System
- Public API endpoints for searching programs and content
- Search interface with full text search
- Filtering by category, type, and language
- Pagination support
- Browse programs by category or type
- Redis-backed cache with automatic invalidation via RabbitMQ events
- Elasticsearch secondary index powering fast full-text search, filters, and sort options
- BullMQ-powered background job workers that reindex Elasticsearch asynchronously
- Health check endpoints monitoring database, Redis, and Elasticsearch connectivity

## Service Layout

This repository follows a monorepo layout with two microservices and shared libraries:

- `apps/cms-service` – Internal CMS microservice responsible for authoring, validating, and publishing programs.
- `apps/discovery-service` – Public-facing microservice that exposes search/browse APIs for end users.
- `libs/shared-programs` – Shared TypeORM entities, enums, and event contracts.
- `libs/shared-config` – Shared infrastructure configuration (database, Swagger, validation).
- `libs/shared-events` – RabbitMQ event system (publishers, listeners, configuration).
- `libs/shared-cache` – Redis caching module and service.
- `libs/shared-storage` – S3-compatible object storage module for media files.

Each service has its own entry point (`main.ts`), module tree, Swagger document, and can be deployed/scaled independently. Shared code is imported through path aliases (e.g., `@octonyah/shared-programs`, `@octonyah/shared-config`) to keep the services decoupled while avoiding duplication.

Supporting infrastructure (local/dev via Docker Compose):

- `postgres` – canonical system of record for programs
- `rabbitmq` – async event bus between services
- `redis` – cache backing the discovery service and transport for BullMQ queues
- `elasticsearch` – search/read model optimized for full-text queries, filtering, autocomplete
- `minio` – S3-compatible object storage for media files (videos and thumbnails)
- `bullmq workers` – discovery-service background processors that rebuild the search index

## Inter-service Communication

- **Asynchronous messaging**: CMS publishes RabbitMQ events (`program.created`, `program.updated`, `program.deleted`) whenever content changes. Discovery subscribes to the same queue using NestJS’s RMQ transport, enabling cache invalidation, search-index refreshes, analytics fan-out, etc.
- **Shared contracts**: Event names and payload contracts live in `libs/shared-programs`, ensuring publishers and consumers stay aligned without tight coupling.
- **Caching + invalidation**: Discovery caches read-heavy endpoints (individual program fetch + search queries) in Redis with a configurable TTL. CMS emits events, and the discovery service invalidates affected cache keys immediately (program-specific keys + all search-result caches), keeping cached data fresh without synchronous coordination.
- **Elasticsearch read model**: Discovery maintains a secondary search index that is updated asynchronously from CMS events and BullMQ worker jobs, allowing fast full-text search, filtering, and sorting without hammering Postgres.
- **Scalable & Future-ready**: Additional consumers (Redis cache warmers, BullMQ queues, analytics services) can subscribe to the same events without modifying the core services.

## Tech Stack

### Backend Framework
- **NestJS** - Node.js framework
- **TypeScript** - So that I don't lose my mind programming in cowboy JavaScript

### Messaging & Communication
- **RabbitMQ** - Asynchronous event bus for cross-service communication

### Caching & Background Jobs
- **Redis** - Distributed cache for potentially read-heavy discovery endpoints with TTL and invalidation
- **BullMQ** - Redis-backed queues that power Elasticsearch reindex jobs

### Search & Read Models
- **Elasticsearch** - Secondary index optimized for full-text search, filters, and high-concurrency read/query workloads

### Object Storage
- **MinIO** - AWS S3-compatible object storage for media files (videos and thumbnail images)
- **AWS S3 SDK** - Client library for S3-compatible storage operations (upload, delete, signed URLs)

### Database & ORM
- **PostgreSQL** - Reliable relational database, easy to run locally via Docker
- **TypeORM** - Object-Relational Mapping for database operations

### Validation & Transformation
- **class-validator** - Decorator-based validation
- **class-transformer** - Object transformation utilities

### API Documentation
- **Swagger/OpenAPI** - Interactive API documentation

### Monitoring & Health Checks
- **@nestjs/terminus** - Health check framework for monitoring service dependencies

### Development Tools
- **Jest** - Testing framework
- **ESLint** - Code linting
- **Prettier** - Code formatting

## Prerequisites

- Node.js (v18.19.1 or higher recommended)
- npm (v10.2.0 or higher)

## Installation

1. **Clone the repository** (or navigate to the project directory):
   ```bash
   cd octonyah-cms
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```
   
   The `.env` file contains:
   ```env
   PORT=3000
   DB_TYPE=postgres
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=postgres
   DB_DATABASE=octonyah
   NODE_ENV=development
   ```

## Configuration

The application uses environment variables for configuration. Edit the `.env` file to customize:

- `CMS_PORT` / `DISCOVERY_PORT` - Default ports for each microservice
- `DB_HOST` / `DB_PORT` - PostgreSQL host and port
- `DB_USERNAME` / `DB_PASSWORD` - PostgreSQL credentials
- `DB_DATABASE` - PostgreSQL database name (default: octonyah)
- `RABBITMQ_URL` - Connection string for RabbitMQ (e.g., `amqp://guest:guest@localhost:5672`)
- `RABBITMQ_QUEUE` - Queue name for program events (default: `program-events`)
- `RABBITMQ_PREFETCH` - Prefetch count for consumers (default: `1`)
- `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD` - Redis connection settings (host defaults to `localhost`)
- `REDIS_TTL_SECONDS` - TTL for cached items (default: `300`)
- `ELASTICSEARCH_NODE` - Elasticsearch node URL (default: `http://localhost:9200`)
- `ELASTICSEARCH_USERNAME` / `ELASTICSEARCH_PASSWORD` - Optional basic auth credentials
- `ELASTICSEARCH_INDEX` - Index name for programs (default: `programs`)
- `S3_ENDPOINT` - MinIO/S3 endpoint URL (default: `http://localhost:9000`, use `http://minio:9000` in Docker)
- `S3_ACCESS_KEY` - S3 access key (default: `minioadmin`)
- `S3_SECRET_KEY` - S3 secret key (default: `minioadmin`)
- `S3_BUCKET` - S3 bucket name for storing media files (default: `programs-media`)
- `S3_REGION` - S3 region (default: `us-east-1`)
- `NODE_ENV` - Environment mode (development/production)

## Running the Application

### Docker Compose (All services)

Run the entire stack (Postgres + both microservices) with a single command:

```bash
docker compose up --build
```

Exposed endpoints:

- CMS service → http://localhost:3000 (Swagger at `/api`)
- Discovery service → http://localhost:3001 (Swagger at `/api`)
- RabbitMQ → AMQP `localhost:5672`, management UI `http://localhost:15672` (guest/guest)
- Redis → `localhost:6379`
- MinIO → API `http://localhost:9000`, Console `http://localhost:9001` (minioadmin/minioadmin)
- BullMQ workers → run inside discovery-service container, exposed via logs/queues
- Postgres → `localhost:5432` (credentials defined in `docker-compose.yml`)

### Other Commands

- **Run tests**: `npm test`
- **Run tests in watch mode**: `npm run test:watch`
- **Run tests with coverage**: `npm run test:cov`
- **Lint code**: `npm run lint`

## API Documentation

### Authentication (CMS service)

- `POST /auth/login` – Exchange username/password for a JWT access token.
- Sample users (stored in-memory for this prototype):
  - **Admin** – username: `admin`, password: `admin123` (roles: admin + editor)
  - **Editor** – username: `editor`, password: `editor123` (role: editor)
- Include the JWT via `Authorization: Bearer <token>` on any `/cms/**` request.
- RBAC summary:
  - `admin` → full access (create, update, delete)
  - `editor` → create/update/read only (no delete)

### Swagger UI

Once each service is running, Swagger UI is exposed per service:

- CMS service: `http://localhost:${CMS_PORT}/api` (default `http://localhost:3000/api`)
- Discovery service: `http://localhost:${DISCOVERY_PORT}/api` (default `http://localhost:3001/api`)

Swagger UI provides:
- Complete API endpoint documentation
- Interactive testing interface
- Request/response schemas
- Example requests

### API Endpoints

#### CMS service (internal)
- Base URL: `http://localhost:${CMS_PORT}` (default `http://localhost:3000`)
- `GET /` - Hello World endpoint for testing
- `POST /cms/programs` - Create a new program
- `GET /cms/programs` - Get all programs
- `GET /cms/programs/:id` - Get a program by ID
- `PATCH /cms/programs/:id` - Update a program
- `DELETE /cms/programs/:id` - Delete a program (also removes associated media files from storage)
- `POST /cms/programs/upload/video` - Upload a video file (max 500MB, multipart/form-data)
- `POST /cms/programs/upload/thumbnail` - Upload a thumbnail image (max 10MB, multipart/form-data)

#### Discovery service (public)
- Base URL: `http://localhost:${DISCOVERY_PORT}` (default `http://localhost:3001`)
- `GET /` - Hello endpoint for sanity checks
- `GET /discovery/search` - Search programs with filters and pagination
- `GET /discovery/programs/:id` - Get a program by ID (public)
- `GET /discovery/categories/:category` - Get programs by category
- `GET /discovery/types/:type` - Get programs by type
- `POST /discovery/search/reindex` - Enqueue a BullMQ job to rebuild the Elasticsearch index (internal use)

#### Health Check Endpoints
Both services expose health check endpoints for monitoring and orchestration:

- **CMS Service**: `GET /health` - Checks database connectivity
- **Discovery Service**: `GET /health` - Checks database, Redis, and Elasticsearch connectivity

Health check responses follow the standard format:
```json
{
  "status": "ok",
  "info": {
    "database": { "status": "up" },
    "redis": { "status": "up" },
    "elasticsearch": { "status": "up" }
  },
  "error": {},
  "details": {
    "database": { "status": "up" },
    "redis": { "status": "up" },
    "elasticsearch": { "status": "up" }
  }
}
```

If any dependency is down, the `status` will be `"error"` and the failing service will appear in the `error` object with details about the failure. These endpoints are useful for:
- Load balancer health checks
- Kubernetes liveness/readiness probes
- Monitoring and alerting systems
- Container orchestration platforms

##### Search query parameters (`GET /discovery/search`)
- `q` – Free-text query (title, description, tags) with fuzzy matching
- `category`, `type`, `language` – Exact-match filters
- `tags` – Repeatable query param for multi-tag filtering (`?tags=tech&tags=history`)
- `startDate` / `endDate` – Filter by publication date range (ISO strings)
- `sort` – `relevance` (default), `date` (newest first), or `popular`
- `page` / `limit` – Pagination controls (limit capped at 100)

### Health Check Examples

**Check CMS service health:**
```bash
curl http://localhost:3000/health
```

**Check Discovery service health:**
```bash
curl http://localhost:3001/health
```

The health endpoints return HTTP 200 when all dependencies are healthy, and HTTP 503 when any dependency is down.

### Example API Calls

**Create a program:**
```bash
curl -X POST http://localhost:3000/cms/programs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "title": "أوكتو",
    "description": "برنامج ثماني-قصدي أوكتانيه",
    "category": "Technology",
    "type": "video_podcast",
    "language": "ar",
    "duration": 3600,
    "publicationDate": "2024-01-15",
    "videoUrl": "http://minio:9000/programs-media/videos/uuid.mp4",
    "thumbnailImageUrl": "http://minio:9000/programs-media/thumbnails/uuid.jpg"
  }'
```

**Upload a video file:**
```bash
curl -X POST http://localhost:3000/cms/programs/upload/video \
  -H "Authorization: Bearer <your-jwt-token>" \
  -F "file=@/path/to/video.mp4"
```

**Upload a thumbnail image:**
```bash
curl -X POST http://localhost:3000/cms/programs/upload/thumbnail \
  -H "Authorization: Bearer <your-jwt-token>" \
  -F "file=@/path/to/thumbnail.jpg"
```

The upload endpoints return a JSON response with the `url` field containing the full URL to the uploaded file, which can then be used in the `videoUrl` or `thumbnailImageUrl` fields when creating/updating programs.

**Search programs (discovery service):**
```bash
curl "http://localhost:3001/discovery/search?q=technology&tags=innovation&tags=startup&sort=date&limit=10"
```

## Architecture

### System Architecture Diagram

```mermaid
flowchart TD
    %% Users
    I((Admin/Editors)):::actor
    U((Users)):::actor

    %% CMS System
    A[CMS Service<br/>Port 3000]:::service
    B[(PostgreSQL<br/>Database)]:::database
    M[MinIO / AWS S3<br/>Object Storage]:::storage
    
    I -->|create/update/delete| A
    A -->|writes program data| B
    A -->|uploads media files| M
    A -->|publishes events| C

    %% Event Bus
    C[RabbitMQ<br/>Event Bus]:::queue
    C -->|consumes events| D

    %% Discovery Service
    D[Discovery Service<br/>Port 3001]:::service
    D -->|invalidates cache| E
    D -->|enqueues jobs| E

    %% Cache & Queue
    E[Redis<br/>Cache & Queue]:::queue
    E -->|consumes jobs| F

    %% Background Worker
    F[BullMQ Workers<br/>Background Service]:::worker
    F -->|reads data| B
    F -->|indexes data| G

    %% Search Index
    G[Elasticsearch<br/>Search Index]:::search
    D -->|queries| G
    D -->|reads cache| E

    %% Discovery API
    U -->|search/browse| D

    %% Styling
    classDef actor fill:#e1f5fe,stroke:#01579b,stroke-width:2px,color:#000
    classDef service fill:#f3e5f5,stroke:#4a148c,stroke-width:2px,color:#000
    classDef database fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px,color:#000
    classDef worker fill:#fff3e0,stroke:#e65100,stroke-width:2px,color:#000
    classDef queue fill:#fce4ec,stroke:#880e4f,stroke-width:2px,color:#000
    classDef search fill:#e0f2f1,stroke:#004d40,stroke-width:2px,color:#000
    classDef storage fill:#ede7f6,stroke:#311b92,stroke-width:2px,color:#000
```

### Project Structure

```
apps/
├── cms-service/
│   └── src/
│       ├── app.controller.ts
│       ├── app.module.ts
│       ├── main.ts
│       ├── auth/                          # Authentication & Authorization
│       │   ├── auth.controller.ts
│       │   ├── auth.module.ts
│       │   ├── auth.service.ts
│       │   ├── dto/
│       │   │   └── login.dto.ts
│       │   ├── guards/
│       │   │   ├── jwt-auth.guard.ts
│       │   │   └── roles.guard.ts
│       │   ├── jwt-payload.interface.ts
│       │   ├── jwt.strategy.ts
│       │   └── roles.decorator.ts
│       ├── health/                        # Health check endpoints
│       │   ├── health.controller.ts
│       │   └── health.module.ts
│       └── modules/
│           ├── cms.module.ts
│           └── programs/
│               ├── dto/
│               │   ├── create-program.dto.ts
│               │   └── update-program.dto.ts
│               ├── programs.controller.ts
│               ├── programs.module.ts
│               ├── programs.service.ts
│               └── programs.service.spec.ts
└── discovery-service/
    └── src/
        ├── app.controller.ts
        ├── app.module.ts
        ├── main.ts
        ├── health/                        # Health check endpoints
        │   ├── health.controller.ts
        │   ├── health.module.ts
        │   ├── redis-health.indicator.ts
        │   └── elasticsearch-health.indicator.ts
        ├── jobs/                          # Background job processing
        │   ├── jobs.module.ts
        │   ├── program-index.processor.ts
        │   ├── program-index.queue.service.ts
        │   └── program-index.queue.ts
        ├── modules/
        │   ├── discovery.module.ts
        │   ├── discovery.controller.ts
        │   ├── discovery.service.ts
        │   ├── program-events.listener.ts  # RabbitMQ event listener
        │   └── dto/
        │       ├── search-programs.dto.ts
        │       └── search-response.dto.ts
        └── search/                        # Elasticsearch integration
            ├── search.module.ts
            ├── program-search.service.ts
            └── program-search.types.ts

libs/
├── shared-programs/                       # Domain entities & events
│   └── src/
│       ├── entities/
│       │   └── program.entity.ts
│       ├── events/
│       │   └── program-events.ts
│       └── index.ts
├── shared-config/                         # Infrastructure configuration
│   └── src/
│       ├── database/
│       │   └── database.module.ts
│       ├── bootstrap/
│       │   ├── swagger-config.factory.ts
│       │   └── validation-pipe.config.ts
│       └── index.ts
├── shared-events/                         # Event system (RabbitMQ)
│   └── src/
│       ├── rmq/
│       │   └── rmq.module.ts
│       ├── publisher/
│       │   ├── event-publisher.service.ts
│       │   └── program-events.publisher.ts
│       ├── listener/
│       │   └── event-listener.base.ts
│       └── index.ts
├── shared-cache/                          # Redis caching
│   └── src/
│       ├── redis-cache.module.ts
│       ├── redis-cache.service.ts
│       ├── cache.constants.ts
│       └── index.ts
└── shared-storage/                        # Object storage (S3/MinIO)
    └── src/
        ├── storage.module.ts
        ├── storage.service.ts
        └── index.ts
```

### Modular Architecture

Octonyah follows a **microservices architecture** layered on top of NestJS' modular pattern with shared libraries:

#### Microservices

1. **CMS microservice (`apps/cms-service`)** – Internal content management
   - Handles CRUD operations for programs
   - JWT-based authentication with role-based access control (admin, editor)
   - Validates input data using class-validator
   - Manages program metadata and media files via shared storage library
   - Publishes events to RabbitMQ when programs are created/updated/deleted
   - Uses shared libraries: `shared-programs`, `shared-config`, `shared-events`, `shared-storage`

2. **Discovery microservice (`apps/discovery-service`)** – Public search and exploration
   - Provides search functionality with full-text search via Elasticsearch
   - Implements filtering, pagination, and browse experiences
   - Redis-backed caching with automatic invalidation via RabbitMQ events
   - BullMQ-powered background jobs for Elasticsearch reindexing
   - Exposes only read APIs to keep the surface limited and cache-friendly
   - Uses shared libraries: `shared-programs`, `shared-config`, `shared-events`, `shared-cache`

#### Shared Libraries

3. **Shared Programs (`libs/shared-programs`)**
   - Hosts the `Program` TypeORM entity and enums so both services stay in sync
   - Defines event contracts (`program.created`, `program.updated`, `program.deleted`)
   - Single source of truth for domain models

4. **Shared Config (`libs/shared-config`)**
   - Centralized TypeORM database configuration
   - Reusable Swagger configuration factory
   - Shared ValidationPipe configuration
   - Eliminates duplication across services

5. **Shared Events (`libs/shared-events`)**
   - RabbitMQ module configuration
   - Event publisher service for publishing domain events
   - Event listener base classes for consuming events
   - Standardized event communication patterns

6. **Shared Cache (`libs/shared-cache`)**
   - Redis cache module and service
   - Provides caching utilities with TTL support
   - Used by discovery service for read-heavy endpoints

7. **Shared Storage (`libs/shared-storage`)**
   - S3-compatible object storage module (MinIO/AWS S3)
   - Handles media file uploads, deletions, and URL generation
   - Used by CMS service for video and thumbnail management

## System Design

### 1. NestJS Framework

- Built-in support for TypeScript
- Modular architecture out of the box
- Inversion of control thru its dependency injection system
- Built-in support for Swagger, validation, and testing

### 2. PostgreSQL Database

- Production-ready transactional relational database with strong reliability guarantees
- Works seamlessly with TypeORM and NestJS ecosystem
- If scaling vertically becomes infeasible down the line, then we can upgrade Postgres to Citus Data distributed database to scale horizontally

### 3. Microservices + Shared Library

- CMS and Discovery as separate NestJS applications that share a small library.
- Teams can deploy/scale authoring and discovery independently
- Shared library keeps entities in sync without tight coupling
- Public surface (discovery) does not expose write operations
- Each service can be replicated or containerized

### 4. RabbitMQ Event Bus

- Use RabbitMQ for asynchronous communication between services.
- Decouples CMS's writes from discovery's read-side concerns (cache, index, analytics)
- Offers durable delivery and retry semantics out of the box

### 5. Redis Cache for Discovery

- Cache read-heavy discovery endpoints (search + program detail) in Redis with TTL and invalidate via CMS events.
- Reduces load on Postgres when discovery traffic spikes
- Keeps cache warm for the most common queries
- TTL ensures stale data eventually expires even if an event is missed
- CMS-driven events purge stale keys immediately (program-level + all search keys)

### 6. Elasticsearch as the Read Model
- Discovery search is delegated to Elasticsearch while PostgreSQL remains the write model.
- Search-as-you-type analyzers, full-text relevance, and aggregations are native features
- PostgreSQL stays optimized for canonical writes, relations, and transactions
- RabbitMQ + BullMQ keep indices eventually consistent without synchronous coupling
- Discovery can scale independently for high read traffic

### 6. BullMQ Background Jobs
- Use BullMQ (Redis-backed) workers inside the discovery service to rebuild and heal the Elasticsearch index.
- Queue provides retryable, observable jobs for large reindex operations
- Decouples RabbitMQ event handling from heavy index writes
- Allows triggering reindexing via HTTP without locking the main request cycle

### 7. MinIO Object Storage (AWS S3-compatible)
- MinIO provides S3-compatible object storage for media files (videos and thumbnail images)
- Files are stored in organized folders (`videos/` and `thumbnails/`) with UUID-based naming
- Storage service automatically creates the bucket on application startup
- Media files are automatically deleted when programs are removed or when URLs are updated
- Supports both direct access URLs and signed URLs for secure, time-limited access
- Can be replaced with AWS S3 or other S3-compatible services by updating environment variables

## License

This project is licensed under the "if this system makes you lose all of your content and sets your computer on fire then don't associate me with it" license 🥀.
