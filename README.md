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
- Input validation and error handling
- RESTful API endpoints for frontend integration
- Swagger documentation
- JWT auth + RBAC (admin, editor) for CMS-only endpoints

### Discovery System
- Public API endpoints for searching programs and content
- Search interface with full text search
- Filtering by category, type, and language
- Pagination support
- Browse programs by category or type
- Redis-backed cache with automatic invalidation via RabbitMQ events
- Elasticsearch secondary index powering fast full-text search, filters, and sort options
- BullMQ-powered background job workers that reindex Elasticsearch asynchronously

## Service Layout

This repository follows a monorepo layout with two microservices and one shared library:

- `apps/cms-service` – Internal CMS microservice responsible for authoring, validating, and publishing programs.
- `apps/discovery-service` – Public-facing microservice that exposes search/browse APIs for end users.
- `libs/shared-programs` – Shared TypeORM entities, enums, and future cross-service contracts.

Each service has its own entry point (`main.ts`), module tree, Swagger document, and can be deployed/scaled independently. Shared code is imported through path aliases (`@octonyah/shared-programs`) to keep the services decoupled while avoiding duplication.

Supporting infrastructure (local/dev via Docker Compose):

- `postgres` – canonical system of record for programs
- `rabbitmq` – async event bus between services
- `redis` – cache backing the discovery service and transport for BullMQ queues
- `elasticsearch` – search/read model optimized for full-text queries, filtering, autocomplete
- `bullmq workers` – discovery-service background processors that rebuild the search index

## Inter-service Communication

- **Synchronous HTTP**: Any future synchronous calls between services (if needed) can continue to use REST since each service already exposes its own HTTP API.
- **Asynchronous messaging**: CMS publishes RabbitMQ events (`program.created`, `program.updated`, `program.deleted`) whenever content changes. Discovery subscribes to the same queue using NestJS’s RMQ transport, enabling cache invalidation, search-index refreshes, analytics fan-out, etc.
- **Shared contracts**: Event names and payload contracts live in `libs/shared-programs`, ensuring publishers and consumers stay aligned without tight coupling.
- **Caching + invalidation**: Discovery caches read-heavy endpoints (individual program fetch + search queries) in Redis with a configurable TTL. CMS emits events, and the discovery service invalidates affected cache keys immediately (program-specific keys + all search-result caches), keeping cached data fresh without synchronous coordination.
- **Elasticsearch read model**: Discovery maintains a secondary search index that is updated asynchronously from CMS events and BullMQ worker jobs, allowing fast full-text search, filtering, and sorting without hammering Postgres.
- **Future-ready**: Additional consumers (Redis cache warmers, BullMQ queues, analytics services) can subscribe to the same events without modifying the core services.

## Tech Stack

### Core Framework
- **NestJS** - Node.js framework
- **TypeScript** - So that I don't lose my mind programming in cowboy JavaScript

### Messaging & Communication
- **RabbitMQ** - Asynchronous event bus for cross-service communication

### Caching & Background Jobs
- **Redis** - Distributed cache for potentially read-heavy discovery endpoints with TTL and invalidation
- **BullMQ** - Redis-backed queues that power Elasticsearch reindex jobs

### Search & Read Models
- **Elasticsearch** - Secondary index optimized for full-text search, filters, and high-concurrency read/query workloads

### Database & ORM
- **PostgreSQL** - Reliable relational database, easy to run locally via Docker
- **TypeORM** - Object-Relational Mapping for database operations

### Validation & Transformation
- **class-validator** - Decorator-based validation
- **class-transformer** - Object transformation utilities

### API Documentation
- **Swagger/OpenAPI** - Interactive API documentation

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
- `NODE_ENV` - Environment mode (development/production)

## Running the Application

### Start PostgreSQL (local dev)

If you don't already have PostgreSQL running, you can spin up a disposable instance via Docker:

```bash
docker run --name octonyah-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=octonyah \
  -p 5432:5432 \
  -d postgres:16
```

Update the `.env` file if you change any of the credentials or ports.

### Development Mode

### Docker Compose (All services + Postgres)

Run the entire stack (Postgres + both microservices) with a single command:

```bash
docker compose up --build
```

Run each microservice in its own terminal:

#### CMS service (internal APIs)

```bash
npm run start:cms:dev
```

Default endpoint: `http://localhost:${CMS_PORT}` (3000 by default).

#### Discovery service (public APIs)

```bash
npm run start:discovery:dev
```

Default endpoint: `http://localhost:${DISCOVERY_PORT}` (3001 by default).

### Production Mode

1. Build both services:
   ```bash
   npm run build
   ```

2. Start the desired service:
   ```bash
   npm run start:prod           # CMS service
   npm run start:discovery:prod # Discovery service
   ```

Exposed endpoints:

- CMS service → http://localhost:3000 (Swagger at `/api`)
- Discovery service → http://localhost:3001 (Swagger at `/api`)
- RabbitMQ → AMQP `localhost:5672`, management UI `http://localhost:15672` (guest/guest)
- Redis → `localhost:6379`
- BullMQ workers → run inside discovery-service container, exposed via logs/queues
- Postgres → `localhost:5432` (credentials defined in `docker-compose.yml`)

### Other Commands

- **Run tests**: `npm test`
- **Run tests in watch mode**: `npm run test:watch`
- **Run tests with coverage**: `npm run test:cov`
- **Lint code**: `npm run lint`
- **Format code**: `npm run format`

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
- `DELETE /cms/programs/:id` - Delete a program

#### Discovery service (public)
- Base URL: `http://localhost:${DISCOVERY_PORT}` (default `http://localhost:3001`)
- `GET /` - Hello endpoint for sanity checks
- `GET /discovery/search` - Search programs with filters and pagination
- `GET /discovery/programs/:id` - Get a program by ID (public)
- `GET /discovery/categories/:category` - Get programs by category
- `GET /discovery/types/:type` - Get programs by type
- `POST /discovery/search/reindex` - Enqueue a BullMQ job to rebuild the Elasticsearch index (internal use)

##### Search query parameters (`GET /discovery/search`)
- `q` – Free-text query (title, description, tags) with fuzzy matching
- `category`, `type`, `language` – Exact-match filters
- `tags` – Repeatable query param for multi-tag filtering (`?tags=tech&tags=history`)
- `startDate` / `endDate` – Filter by publication date range (ISO strings)
- `sort` – `relevance` (default), `date` (newest first), or `popular`
- `page` / `limit` – Pagination controls (limit capped at 100)

### Example API Calls

**Create a program:**
```bash
curl -X POST http://localhost:3000/cms/programs \
  -H "Content-Type: application/json" \
  -d '{
    "title": "أوكتو",
    "description": "برنامج ثماني-قصدي أوكتانيه",
    "category": "Technology",
    "type": "video_podcast",
    "language": "ar",
    "duration": 3600,
    "publicationDate": "2024-01-15"
  }'
```

**Search programs (discovery service):**
```bash
curl "http://localhost:3001/discovery/search?q=technology&tags=innovation&tags=startup&sort=date&limit=10"
```

## Architecture

### Project Structure

```
apps/
├── cms-service/
│   └── src/
│       ├── app.controller.ts
│       ├── app.module.ts
│       ├── main.ts
│       └── modules/
│           └── programs/
│               ├── dto/
│               │   ├── create-program.dto.ts
│               │   └── update-program.dto.ts
│               ├── programs.controller.ts
│               ├── programs.module.ts
│               └── programs.service.ts
└── discovery-service/
    └── src/
        ├── app.controller.ts
        ├── app.module.ts
        ├── main.ts
        └── modules/
            └── discovery.module.ts
                ├── discovery.controller.ts
                ├── discovery.service.ts
                └── dto/
                    ├── search-programs.dto.ts
                    └── search-response.dto.ts

libs/
└── shared-programs/            # Shared entities/enums reused by both services
    └── src/
        ├── entities/
        │   └── program.entity.ts
        └── index.ts
```

### Module Architecture

The application now follows a **microservices architecture** layered on top of NestJS' modular pattern:

1. **CMS microservice (`apps/cms-service`)** – Internal content management
   - Handles CRUD operations for programs
   - Validates input data
   - Manages program metadata and future editorial workflows

2. **Discovery microservice (`apps/discovery-service`)** – Public search and exploration
   - Provides search functionality
   - Implements filtering, pagination, and browse experiences
   - Exposes only read APIs to keep the surface limited and cache-friendly

3. **Shared Programs library (`libs/shared-programs`)**
   - Hosts the `Program` entity/enums so both services stay in sync
   - Future place for shared DTOs/messages/events

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

## License

This project is licensed under the "if this system makes you lose all of your content and sets your computer on fire then don't associate me with it" license 🥀.
