# Arman Malik — Backend Coding Assessment

A secure, production-oriented TypeScript REST backend developed for the GGI Backend Test Posture coding assessment.

The application is built with NestJS, PostgreSQL, Prisma, and TypeScript. It follows Domain-Driven Design (DDD) and Clean Architecture principles and implements external OAuth2/OpenID Connect authentication, role-based authorization, secure AI chat quotas, subscription lifecycle management, request replay protection, rate limiting, validation, structured errors, logging, health checks, and basic analytics.

---

## Technology Stack

- Node.js
- TypeScript
- NestJS
- PostgreSQL
- Prisma ORM
- Auth0 / OAuth2 / OpenID Connect
- Jest
- ESLint
- Prettier

---

## Architecture Decisions

The backend follows Domain-Driven Design and Clean Architecture principles.

The main business capabilities are separated into independent modules:

```text
src/
├── auth/
│   ├── config/
│   ├── domain/
│   │   └── policies/
│   ├── guards/
│   ├── repositories/
│   ├── services/
│   └── types/
│
├── chat/
│   ├── application/
│   ├── controllers/
│   │   └── dto/
│   ├── domain/
│   │   ├── entities/
│   │   ├── policies/
│   │   └── services/
│   └── repositories/
│
├── common/
│   ├── database/
│   ├── errors/
│   ├── observability/
│   ├── security/
│   └── validation/
│
├── operations/
│   ├── application/
│   ├── controllers/
│   └── domain/
│       └── policies/
│
└── subscriptions/
    ├── application/
    ├── controllers/
    │   └── dto/
    ├── domain/
    │   ├── entities/
    │   ├── policies/
    │   ├── services/
    │   └── value-objects/
    └── repositories/
```

### Domain Layer

Business rules are kept outside controllers and framework-specific transport logic.

Examples include:

- chat quota selection
- subscription plan limits
- subscription lifecycle rules
- resource authorization policies
- administrator analytics authorization
- payment simulation
- subscription pricing

### Application Layer

Application use cases coordinate domain behavior and repository abstractions.

Examples include:

- sending a chat message
- creating a subscription
- cancelling a subscription
- renewing subscriptions
- expiring subscriptions
- retrieving system metrics

### Repository Layer

Persistence is abstracted behind repository interfaces.

Prisma implementations provide PostgreSQL persistence without coupling core business rules directly to controllers.

### Controller Layer

Controllers are intentionally thin. They handle HTTP concerns such as:

- authenticated request context
- DTO input
- authorization at the transport boundary
- delegation to application use cases

---

## Database

PostgreSQL is used as the relational database.

Prisma provides database access, schema management, and migrations.

Persisted concepts include:

- users
- chats
- monthly free usage
- subscriptions
- subscription-period usage
- request nonces

Database constraints and transactions are used where appropriate for consistency and concurrency safety.

---

# Security Model

Security is treated as a cross-cutting concern rather than being implemented only at the controller level.

## Authentication

Authentication is delegated to an external OAuth2/OpenID Connect provider.

The implementation is configured for Auth0 rather than implementing custom authentication.

The backend verifies access tokens server-side using:

- cryptographic signature verification
- RS256
- remote JWKS
- issuer validation
- audience validation
- expiration validation
- subject validation

Authentication configuration is provided through environment variables:

```text
AUTH_ISSUER
AUTH_AUDIENCE
AUTH_JWKS_URI
```

Email/password and social OAuth authentication are handled by the configured identity provider.

---

## Additional Request Proof

Possession of a valid access token alone is not sufficient to access protected API endpoints.

Authenticated requests must also provide:

```http
x-request-timestamp: <unix-timestamp-seconds>
x-request-nonce: <unique-random-value>
```

The backend validates the timestamp against a bounded clock-skew window.

Nonces are persisted in PostgreSQL and protected by a uniqueness constraint. Reusing the same nonce is rejected, providing replay protection for authenticated requests.

A new nonce should be generated for every request.

---

## Role-Based Access Control

The application supports:

```text
USER
ADMIN
```

Normal users can operate on their own resources.

Administrators are permitted to perform system-level operations and access analytics.

Authorization is enforced at the HTTP/controller boundary and through domain authorization policies.

---

## HTTP Security

The application implements:

- Helmet security headers
- disabled `X-Powered-By`
- restricted CORS origins
- JSON Content-Type enforcement for body requests
- configurable request body size limits
- configurable request timeouts
- centralized error handling

---

## Input Validation

NestJS validation is configured with strict DTO handling.

The application:

- validates DTO fields
- strips/rejects unexpected properties
- rejects non-whitelisted input
- limits chat question length
- rejects HTML markup in chat questions
- prevents clients from supplying server-owned subscription fields

Subscription price, quota, ownership, dates, and status are determined by the backend.

---

## Rate Limiting

The API supports both IP-based and authenticated-user rate limiting.

Different limits are configured for:

- authentication
- chat operations
- subscription operations

Configuration is controlled through environment variables.

The current rate limiter uses application-process memory. For a horizontally scaled production deployment, the same rate-limit boundary could use a shared store such as Redis.

---

# AI Chat

The AI implementation is intentionally mocked.

No real OpenAI or other external AI API is called.

The mock AI service introduces simulated latency and produces a mock answer and token-usage value.

Each successful chat persists:

- user reference
- question
- answer
- token usage
- timestamp

---

## Free Monthly Usage

Every user receives:

```text
3 free chat messages per calendar month
```

Free usage is tracked by user, month, and year.

A new calendar month therefore creates a new usage period.

---

## Subscription Quotas

After the free monthly quota is exhausted, an active subscription with remaining quota is required.

| Plan | Message Allowance |
| --- | ---: |
| Basic | 10 |
| Pro | 100 |
| Enterprise | Unlimited |

Multiple active subscription bundles are supported.

When multiple eligible bundles exist, the application selects the most recently started eligible subscription with available quota.

Quota consumption and chat persistence are performed transactionally to protect usage consistency under concurrent requests.

---

# Subscription Management

The backend supports three subscription tiers:

- Basic
- Pro
- Enterprise

and two billing cycles:

- Monthly
- Yearly

Subscriptions maintain:

- tier
- billing cycle
- maximum messages
- price
- start date
- end date
- renewal date
- active/inactive status
- auto-renew state
- cancellation date

---

## Server-Controlled Pricing

Subscription pricing is controlled by the server through:

```text
SUBSCRIPTION_PRICE_BASIC
SUBSCRIPTION_PRICE_PRO
SUBSCRIPTION_PRICE_ENTERPRISE
```

Clients cannot submit their own subscription price.

---

## Automatic Renewal

A scheduled process evaluates subscriptions requiring renewal.

Payment processing is intentionally simulated.

When the simulated payment succeeds, the subscription is renewed for the next billing period.

When the simulated payment fails, the subscription is marked inactive.

---

## Cancellation

Cancellation does not immediately delete or terminate the paid subscription period.

Instead, cancellation:

- disables automatic renewal
- records the cancellation date
- prevents future renewal
- preserves subscription history
- allows access through the current billing period

---

# Error Handling

Application errors are handled centrally and returned as structured JSON.

Domain errors are translated into appropriate HTTP responses without exposing unnecessary implementation details.

Handled conditions include:

- invalid authentication
- forbidden access
- missing resources
- quota exhaustion
- rate limiting
- request timeout
- oversized request payloads
- validation errors

---

# Observability

HTTP requests are logged using structured JSON.

Request logs contain information such as:

- request ID
- authenticated user ID when available
- HTTP method
- request path
- status code
- response time
- timestamp

Responses include an:

```http
x-request-id
```

header for request correlation.

---

## Health Endpoint

```http
GET /health
```

The health endpoint is protected by authentication.

---

## Metrics Endpoint

```http
GET /metrics
```

The metrics endpoint is authenticated and restricted to administrators.

It exposes basic usage and subscription statistics.

---

# API Examples

All protected requests require:

```http
Authorization: Bearer <access-token>
x-request-timestamp: <unix-timestamp-seconds>
x-request-nonce: <unique-random-value>
```

## Send Chat Message

```http
POST /chat
Content-Type: application/json

{
  "question": "Explain Domain-Driven Design briefly"
}
```

---

## Create Subscription

```http
POST /subscriptions
Content-Type: application/json

{
  "tier": "BASIC",
  "billingCycle": "MONTHLY",
  "autoRenew": true
}
```

Price, quota, ownership, status, and billing dates are determined server-side.

---

## Cancel Subscription

```http
DELETE /subscriptions/:subscriptionId
```

---

## Health

```http
GET /health
```

---

## Metrics

Administrator only:

```http
GET /metrics
```

---

## Setup Instructions

### Prerequisites

Install:

- Node.js
- npm
- PostgreSQL

---

## 1. Clone the Repository

```bash
git clone <repository-url>
cd arman-malik
```

---

## 2. Install Dependencies

```bash
npm install
```

---

## 3. Configure Environment Variables

Copy the supplied example:

### Windows PowerShell

```powershell
Copy-Item .env.example .env
```

### Linux/macOS

```bash
cp .env.example .env
```

Configure the required PostgreSQL, OAuth/OIDC, CORS, rate-limit, request-limit, and subscription-pricing values in `.env`. Do not commit `.env`.

## 4. Create the PostgreSQL Database

Create a PostgreSQL database matching the database name configured in `DATABASE_URL`.

For example:

```text
arman_malik_backend
```

---

## 5. Generate the Prisma Client

```bash
npx prisma generate
```

---

## 6. Apply Database Migrations

For an existing environment:

```bash
npx prisma migrate deploy
```

For local development when creating new migrations:

```bash
npx prisma migrate dev
```

---

### 7. Start the application

```bash
npm run start:dev
```

By default, the API runs at `http://localhost:3000` unless `PORT` is changed.

### 8. Run tests

Run all tests serially:

```bash
npm test -- --runInBand
```

---

### 9. Code Quality

Run ESLint:

```bash
npm run lint
```

### 10. Create a production build:

```bash
npm run build
```
TypeScript strict mode is enabled.

ESLint and Prettier are configured for consistent code quality and formatting.

If Node has limited available memory during local compilation, the heap can be increased temporarily:

### PowerShell

```powershell
$env:NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

---

## Author

**Arman Malik**
