# Arman Malik — Backend Coding Assessment

Secure TypeScript REST backend built for the GGI Backend Test Posture assessment using NestJS, PostgreSQL, Prisma, and Domain-Driven Design principles.

## Architecture Decisions

The application follows Domain-Driven Design (DDD) and Clean Architecture principles.

The backend is divided into independent modules for authentication, AI chat, subscriptions, operations, and shared infrastructure.

Business rules are separated from HTTP/framework concerns using the following layers:

- **Domain layer** — entities, policies, domain services, quota rules, subscription lifecycle rules, and authorization rules.
- **Application layer** — use cases that coordinate domain behavior and repositories.
- **Repository layer** — persistence abstractions with Prisma/PostgreSQL implementations.
- **Controller layer** — thin HTTP controllers responsible for request validation, authentication context, authorization, and delegation to use cases.

The AI Chat and Subscription modules are kept independent.

PostgreSQL is used as the relational database, with Prisma for schema management, migrations, and database access. Database transactions are used for quota consumption and chat persistence to maintain consistency during concurrent requests.

The AI integration is intentionally mocked as required by the assessment. No real external AI API is called. Subscription payment processing is also simulated, including payment failure behavior during renewal.

## Security Model

Authentication is delegated to an external OAuth2/OpenID Connect provider rather than implementing custom authentication.

The backend verifies access tokens server-side using:

- RS256 signature verification
- JWKS
- issuer validation
- audience validation
- expiration validation
- subject validation

A valid access token alone is not sufficient. Protected requests must also include `x-request-timestamp` and `x-request-nonce`. The timestamp is validated against an allowed time window, and request nonces are persisted in PostgreSQL. Reusing a nonce is rejected to provide replay protection.

Role-Based Access Control supports:

- `USER` — access to the user's own resources
- `ADMIN` — system-level access and analytics

Authorization is enforced at the controller boundary and through domain authorization policies.

Additional security controls include:

- Helmet security headers
- disabled `X-Powered-By`
- restricted CORS
- request body size limits
- request timeouts
- JSON Content-Type enforcement
- strict DTO/schema validation
- rejection of unexpected properties
- protection against mass assignment
- HTML/XSS input rejection
- per-IP and per-user rate limiting
- separate rate-limit categories for authentication, chat, and subscriptions
- centralized structured error handling

Secrets and environment-specific configuration are stored in environment variables, and the real `.env` file is excluded from Git.

## Setup Instructions

### Prerequisites

Install:

- Node.js
- npm
- PostgreSQL

### 1. Clone the repository

```bash
git clone <repository-url>
cd arman-malik
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy `.env.example` to `.env`.

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Linux/macOS:

```bash
cp .env.example .env
```

Configure the required PostgreSQL, OAuth/OIDC, CORS, rate-limit, request-limit, and subscription-pricing values in `.env`. Do not commit `.env`.

### 4. Create the PostgreSQL database

Create the database configured by `DATABASE_URL`, for example:

```text
arman_malik_backend
```

### 5. Generate the Prisma client

```bash
npx prisma generate
```

### 6. Apply database migrations

```bash
npx prisma migrate deploy
```

For local migration development:

```bash
npx prisma migrate dev
```

### 7. Start the application

```bash
npm run start:dev
```

By default, the API runs at `http://localhost:3000` unless `PORT` is changed.

### 8. Run tests

```bash
npm test -- --runInBand
```

### 9. Run linting

```bash
npm run lint
```

### 10. Build the project

```bash
npm run build
```

## Assessment PDF

The original assessment specification is included in the repository under:

```text
docs/GGI-Backend-Test-Posture.pdf
```

## Author

**Arman Malik**
