# Octonyah CMS & Discovery System

## Technical Report (Task 3)

This document serves as the technical report for the Octonyah CMS & Discovery System project. It provides comprehensive documentation on how to run and use the system, the architecture and technology stack, design decisions, challenges faced during implementation, and suggestions for future improvements.

---

A two-component system built with NestJS and TypeScript for managing and discovering video podcasts and documentaries. This system provides a Content Management System (CMS) for internal content management and a Discovery System for public search and exploration.

## Table of Contents

- [Features](#features)
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

## Tech Stack

### Core Framework
- **NestJS** (v11.0.1) - Progressive Node.js framework for building efficient server-side applications
- **TypeScript** (v5.7.3) - Type-safe JavaScript for better developer experience

### Database & ORM
- **SQLite** (v5.1.7) - Lightweight, file-based database (chosen for simplicity in this project)
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
   cd octonyah-nestjs
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
   DB_TYPE=sqlite
   DB_DATABASE=octonyah.db
   NODE_ENV=development
   ```

## Configuration

The application uses environment variables for configuration. Edit the `.env` file to customize:

- `PORT` - Server port (default: 3000)
- `DB_DATABASE` - SQLite database filename (default: octonyah.db)
- `NODE_ENV` - Environment mode (development/production)

## Running the Application

### Development Mode

Start the application in watch mode (auto-reloads on file changes):

```bash
npm run start:dev
```

The application will start on `http://localhost:3000` (or the port specified in `.env`).

### Production Mode

1. Build the application:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm run start:prod
   ```

### Other Commands

- **Run tests**: `npm test`
- **Run tests in watch mode**: `npm run test:watch`
- **Run tests with coverage**: `npm run test:cov`
- **Lint code**: `npm run lint`
- **Format code**: `npm run format`

## API Documentation

### Swagger UI

Once the application is running, access the interactive API documentation at:

```
http://localhost:3000/api
```

Swagger UI provides:
- Complete API endpoint documentation
- Interactive testing interface
- Request/response schemas
- Example requests

### API Endpoints

#### Root Endpoint
- `GET /` - Hello World endpoint for testing

#### CMS Endpoints (Internal)
- `POST /cms/programs` - Create a new program
- `GET /cms/programs` - Get all programs
- `GET /cms/programs/:id` - Get a program by ID
- `PATCH /cms/programs/:id` - Update a program
- `DELETE /cms/programs/:id` - Delete a program

#### Discovery Endpoints (Public)
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

**Search programs:**
```bash
curl "http://localhost:3000/discovery/search?q=technology&category=Technology&page=1&limit=20"
```

## Architecture

### Project Structure

```
src/
├── app.module.ts              # Root module
├── app.controller.ts          # Root controller (Hello World)
├── main.ts                    # Application entry point
└── modules/
    ├── cms/                   # Content Management System
    │   ├── cms.module.ts
    │   └── programs/
    │       ├── programs.module.ts
    │       ├── programs.controller.ts
    │       ├── programs.service.ts
    │       ├── entities/
    │       │   └── program.entity.ts
    │       └── dto/
    │           ├── create-program.dto.ts
    │           └── update-program.dto.ts
    └── discovery/             # Discovery System
        ├── discovery.module.ts
        ├── discovery.controller.ts
        ├── discovery.service.ts
        └── dto/
            ├── search-programs.dto.ts
            └── search-response.dto.ts
```

### Module Architecture

The application follows a **modular architecture** with clear separation of concerns:

1. **CMS Module** - Internal content management
   - Handles CRUD operations for programs
   - Validates input data
   - Manages program metadata

2. **Discovery Module** - Public search and exploration
   - Provides search functionality
   - Implements filtering and pagination
   - Separate from CMS to maintain clear boundaries

3. **Shared Entities** - Both modules use the same `Program` entity
   - Ensures data consistency
   - Single source of truth

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

### 2. SQLite Database
**Decision**: Use SQLite instead of PostgreSQL or MySQL.

**Reasoning**:
- Simple setup - no separate database server required
- File-based, easy to backup and version control
- Sufficient for the project scope (job interview project)
- Can easily migrate to PostgreSQL in production
- TypeORM supports multiple databases, making migration straightforward

**Trade-off**: SQLite doesn't support some advanced features (like native ENUM types), but we worked around this by using VARCHAR with validation.

### 3. Modular Architecture
**Decision**: Separate CMS and Discovery into distinct modules.

**Reasoning**:
- **Separation of Concerns**: CMS handles content management, Discovery handles public search
- **Low Coupling**: Modules can evolve independently
- **Clear Boundaries**: Easy to understand which endpoints are internal vs public
- **Scalability**: Can scale modules independently if needed
- **SOLID Principles**: Single Responsibility Principle - each module has one clear purpose

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

### 1. SQLite Enum Limitation
**Challenge**: SQLite doesn't support native ENUM types.

**Solution**: Used VARCHAR columns with enum validation at the application level. The DTOs and entity use TypeScript enums, but the database stores them as strings.

**Impact**: Slight performance overhead for enum validation, but maintains type safety in the application layer.

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

### 1. Database Migration
**Current**: SQLite with `synchronize: true` (development only)

**Improvement**: 
- Migrate to PostgreSQL for production
- Implement proper database migrations
- Add connection pooling for better performance
- Use environment-specific database configurations

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

## Scalability Considerations

For handling **10 million users per hour**, the following would be necessary:

1. **Horizontal Scaling**: Multiple application instances behind a load balancer
2. **Database Scaling**: 
   - Read replicas for Discovery endpoints
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

