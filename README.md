# Octonyah CMS & Discovery System

## Technical Report (Task 3)

This document serves as the technical report for the Octonyah CMS & Discovery System project. It provides comprehensive documentation on how to run and use the system, the architecture and technology stack, design decisions, challenges faced during implementation, and suggestions for future improvements.

---

A two-component system built with NestJS and TypeScript for managing and discovering video podcasts and documentaries. This repository now hosts two independent NestJS microservices—`cms-service` and `discovery-service`—plus a shared library so both services stay in sync while remaining deployable on their own timelines.

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
- [Design Decisions](#design-decisions)
- [Challenges Faced](#challenges-faced)
- [Future Improvements](#future-improvements)

## Features

### Task 1: Content Management System (CMS)
- ✅ CRUD operations for programs (video podcasts and documentaries)
- ✅ Metadata management (title, description, category, language, duration, publication date)
- ✅ Input validation and error handling
- ✅ RESTful API endpoints for frontend integration
- ✅ Swagger documentation

### Task 2: Discovery System
- ✅ Public search interface with text search
- ✅ Filtering by category, type, and language
- ✅ Pagination support
- ✅ Browse programs by category or type
- ✅ Public API endpoints for exploration

## Service Layout

This repository follows a NestJS monorepo layout with two microservices and one shared library:

- `apps/cms-service` – Internal CMS microservice responsible for authoring, validating, and publishing programs.
- `apps/discovery-service` – Public-facing microservice that exposes search/browse APIs for end users.
- `libs/shared-programs` – Shared TypeORM entities, enums, and future cross-service contracts.

Each service has its own entry point (`main.ts`), module tree, Swagger document, and can be deployed/scaled independently. Shared code is imported through path aliases (`@octonyah/shared-programs`) to keep the services decoupled while avoiding duplication.

## Tech Stack

### Core Framework
- **NestJS** (v11.0.1) - Progressive Node.js framework for building efficient server-side applications
- **TypeScript** (v5.7.3) - Type-safe JavaScript for better developer experience

### Database & ORM
- **PostgreSQL** (tested with v16) - Reliable relational database, easy to run locally via Docker
- **TypeORM** (v0.3.27) - Object-Relational Mapping for database operations

### Validation & Transformation
- **class-validator** (v0.14.3) - Decorator-based validation
- **class-transformer** (v0.5.1) - Object transformation utilities

### API Documentation
- **Swagger/OpenAPI** (@nestjs/swagger v11.2.3) - Interactive API documentation

### Development Tools
- **Jest** - Testing framework
- **ESLint** - Code linting
- **Prettier** - Code formatting

## Prerequisites

- Node.js (v18.19.1 or higher recommended)
- npm (v10.2.0 or higher)
- Git

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

Run each microservice in its own terminal (or process manager):

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

### Other Commands

- **Run tests**: `npm test`
- **Run tests in watch mode**: `npm run test:watch`
- **Run tests with coverage**: `npm run test:cov`
- **Lint code**: `npm run lint`
- **Format code**: `npm run format`

## API Documentation

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

### Example API Calls

**Create a program:**
```bash
curl -X POST http://localhost:3000/cms/programs \
  -H "Content-Type: application/json" \
  -d '{
    "title": "تسعة وتسعون",
    "description": "برنامج ثمنية",
    "category": "Technology",
    "type": "video_podcast",
    "language": "ar",
    "duration": 3600,
    "publicationDate": "2024-01-15"
  }'
```

**Search programs (discovery service):**
```bash
curl "http://localhost:3001/discovery/search?q=technology&category=Technology&page=1&limit=20"
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

### Design Patterns

- **Dependency Injection** - NestJS built-in DI container
- **Repository Pattern** - TypeORM repositories for data access
- **DTO Pattern** - Data Transfer Objects for validation
- **Module Pattern** - Feature-based module organization

## Design Decisions

### 1. NestJS Framework
**Decision**: Use NestJS for the backend framework.

**Reasoning**:
- Built-in support for TypeScript
- Modular architecture out of the box
- Excellent dependency injection system
- Strong ecosystem and community support
- Built-in support for Swagger, validation, and testing

### 2. PostgreSQL Database
**Decision**: Use PostgreSQL as the relational database.

**Reasoning**:
- Production-ready relational database with strong reliability guarantees
- Works seamlessly with TypeORM and NestJS ecosystem
- Easy to run locally via Docker while matching production topology
- Supports advanced features (JSONB, full-text search, native enums) for future growth
- Clear migration path to managed cloud databases

**Trade-off**: Requires running a separate service (Docker/container or managed instance), but the extra setup cost is worth the scalability and feature set.

### 3. Microservices + Shared Library
**Decision**: Run CMS and Discovery as separate NestJS applications that share a small library.

**Reasoning**:
- **Separation of Concerns**: Teams can deploy/scale authoring and discovery independently
- **Clear Contracts**: Shared library keeps entities in sync without tight coupling
- **Operational Safety**: Public surface (discovery) does not expose write operations
- **Scalability**: Each service can be replicated or containerized on its own schedule
- **Future-proofing**: Easier to insert message queues/API gateway later

### 4. TypeORM Query Builder for Search
**Decision**: Use TypeORM Query Builder instead of raw SQL for search functionality.

**Reasoning**:
- Type-safe queries
- Database-agnostic (can switch databases easily)
- Built-in protection against SQL injection
- Easy to maintain and extend

### 5. DTOs for Validation
**Decision**: Use class-validator decorators in DTOs.

**Reasoning**:
- Declarative validation rules
- Automatic validation via NestJS ValidationPipe
- Clear, self-documenting validation logic
- Type-safe validation

### 6. Swagger Documentation
**Decision**: Include Swagger UI for API documentation.

**Reasoning**:
- Interactive API testing
- Self-documenting code
- Easy for frontend developers to integrate
- Reduces need for separate API documentation

## Challenges Faced

### 1. PostgreSQL Environment Parity
**Challenge**: Ensuring every environment (local, staging, interview review) runs PostgreSQL with the same configuration.

**Solution**: Externalized every connection parameter to `.env`, added a Docker command for local setup, and switched TypeORM to `forRootAsync` so it reads runtime configuration safely.

**Impact**: Developers can spin up the API against any PostgreSQL instance without changing code, and production can disable schema synchronization while development keeps the fast feedback loop.

### 2. Text Search Implementation
**Challenge**: Implementing efficient text search across title and description fields.

**Solution**: Used TypeORM Query Builder with LIKE operators. For production at scale, this would be replaced with a full-text search engine (Elasticsearch/OpenSearch), but for the project scope, SQL LIKE queries are sufficient.

**Note**: For 10M users/hour, a dedicated search engine would be necessary.

### 3. Pagination Metadata
**Challenge**: Calculating pagination metadata efficiently.

**Solution**: Used TypeORM's `getCount()` and `skip()/take()` methods. The query builder allows efficient counting and pagination in a single transaction.

### 4. Module Coupling
**Challenge**: Discovery module needs access to Program entity without coupling to CMS.

**Solution**: Both modules import the Program entity directly from TypeORM. They share the entity but have separate services and controllers, maintaining low coupling.

## Future Improvements

### 1. Database Hardening
**Current**: PostgreSQL with `synchronize: true` during development.

**Improvement**: 
- Add TypeORM migrations and disable `synchronize` in all shared environments
- Introduce connection pooling/PG Bouncer for better concurrency
- Move to managed PostgreSQL (RDS, Cloud SQL, etc.) with automatic backups
- Use environment-specific configuration files or secrets management

### 2. Full-Text Search
**Current**: SQL LIKE queries for text search

**Improvement**:
- Integrate Elasticsearch or OpenSearch for advanced search
- Implement relevance scoring
- Support for fuzzy matching and typo tolerance
- Multi-language search support

### 3. Caching Layer
**Current**: Direct database queries

**Improvement**:
- Add Redis for caching frequently accessed programs
- Cache search results with TTL
- Implement cache invalidation strategies
- Reduce database load for high-traffic endpoints

### 4. Authentication & Authorization
**Current**: No authentication (all endpoints are open)

**Improvement**:
- Add JWT-based authentication for CMS endpoints
- Implement role-based access control (RBAC)
- Protect CMS endpoints from public access
- Keep Discovery endpoints public

### 5. Rate Limiting
**Current**: No rate limiting

**Improvement**:
- Implement rate limiting for public endpoints
- Protect against DDoS attacks
- Different limits for CMS vs Discovery endpoints
- Use Redis for distributed rate limiting

### 6. Data Import System
**Current**: Manual program creation only

**Improvement**:
- Implement bulk import from CSV/JSON
- YouTube API integration for automatic imports
- Background job processing (BullMQ)
- Import validation and error handling

### 7. Advanced Filtering
**Current**: Basic filtering by category, type, language

**Improvement**:
- Date range filtering
- Duration range filtering
- Multiple category selection
- Sorting options (by date, duration, title)

### 8. Monitoring & Logging
**Current**: Basic console logging

**Improvement**:
- Structured logging (Winston/Pino)
- Request/response logging middleware
- Error tracking (Sentry)
- Performance monitoring (APM)

### 9. Testing
**Current**: Basic unit tests

**Improvement**:
- Comprehensive unit test coverage
- Integration tests for API endpoints
- E2E tests for critical flows
- Load testing for scalability validation

### 10. API Versioning
**Current**: Single API version

**Improvement**:
- Implement API versioning (`/v1/discovery/...`)
- Support multiple API versions simultaneously
- Deprecation strategy for old versions

### 11. Database Indexing
**Current**: Basic indexes from TypeORM

**Improvement**:
- Add indexes on frequently queried fields (category, type, language)
- Full-text indexes for search fields
- Composite indexes for common query patterns
- Monitor query performance

### 12. Error Handling
**Current**: Basic error handling

**Improvement**:
- Custom exception filters
- Standardized error response format
- Error codes and messages
- Detailed error logging

### 13. Service-to-Service Communication
**Current**: Both microservices read/write the same Postgres database directly.

**Improvement**:
- Introduce asynchronous messaging (e.g., NATS, Kafka) for propagating CMS changes
- Add an API gateway if synchronous communication is needed
- Publish domain events from CMS that Discovery (or other consumers) can subscribe to
- Allow future services (search indexers, analytics) to consume the same stream

## Scalability Considerations

For handling **10 million users per hour**, the following would be necessary:

1. **Horizontal Scaling**: Replicate each microservice independently behind load balancers
2. **Database Scaling**: 
   - Read replicas for the discovery microservice
   - Connection pooling (pgBouncer)
   - Database sharding if needed
3. **Caching**: Aggressive caching strategy with Redis
4. **CDN**: Static content delivery via CDN
5. **Search Engine**: Dedicated search engine (Elasticsearch) for Discovery
6. **Monitoring**: Real-time monitoring and auto-scaling

## License

UNLICENSED - Private project

## Author

Built as part of a technical assessment.

