# INMETA Test – Backend (Node.js + TypeScript)

_Read this in other languages: **[Português (Brasil)](README.pt-BR.md)**_

API for managing employee mandatory documentation. Built for real-world deploys with NestJS, PostgreSQL, Keycloak (AuthN/AuthZ), Elasticsearch + Kibana (logs/observability), and Swagger (docs).

Note: No secrets in Git. Use `.env` files locally and CI/CD secrets in pipelines. See Environment below.

---

## Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Domain Model](#domain-model)
- [Environment](#environment)
- [Local Development](#local-development)
- [Database (Postgres)](#database-postgres)
- [Security (Keycloak)](#security-keycloak)
- [Logs & Observability (Elasticsearch/Kibana)](#logs--observability-elasticsearchkibana)
- [API Docs (Swagger)](#api-docs-swagger)
- [Run with Docker](#run-with-docker)
- [Testing](#testing)
- [Production notes](#production-notes)
- [License](#license)

---

## Overview

This service exposes a REST API to:
- Create/update employees
- Create document types
- Link/unlink document types to employees (bulk supported)
- Submit employee documents (metadata representation only; no file upload required)
- Get an employee’s documentation status (sent vs pending)
- List all pending documents with pagination + optional filters (employee / document type)

## Architecture

```
apps/api
 ├─ src
 │   ├─ main.ts                 # bootstrap + global pipes/filters + logging
 │   ├─ app.module.ts
 │   ├─ modules/
 │   │   ├─ employees/
 │   │   ├─ document-types/
 │   │   ├─ documents/
 │   │   └─ health/
 │   ├─ common/
 │   │   ├─ auth/ (Keycloak guards, roles, scopes)
 │   │   ├─ logging/ (pino + transport to Elasticsearch)
 │   │   └─ dto/
 │   └─ infra/
 │       ├─ prisma/ (schema + migrations)
 │       └─ config/
 ├─ prisma/ (schema.prisma, migrations)
 └─ test/
```

- Framework: NestJS (Express adapter) + Class-Validator
- Auth: Keycloak (OpenID Connect); Bearer JWT on all protected routes
- DB: PostgreSQL via Prisma
- Logs: Pino → Elasticsearch (indexed), view in Kibana
- Docs: Swagger at `/docs`
- Packaging: Docker; reverse-proxy via Traefik (provided in infra stack)

## Tech Stack

- Node.js 20 / TypeScript
- NestJS
- Prisma ORM (PostgreSQL)
- Keycloak (OIDC)
- Pino + pino-elasticsearch (logs) / alternatively Elastic APM
- Swagger (OpenAPI 3)
- Docker / docker-compose
- Traefik for TLS and routing

## Domain Model

Suggested entities (you may extend/rename as needed):

- Employee
  - id, name, cpf, hiredAt
- DocumentType
  - id, name
- Document
  - id, name, status (PENDING | SENT)
  - employeeId, documentTypeId
  - submittedAt

Business rules:
- Link/unlink multiple document types at once to an employee
- Submitting a document moves its status to SENT
- Status endpoint returns both sent and pending per employee
- Pending list is pageable and filterable

## Environment

Create your own `.env` based on the template below and never commit secrets. Keep `.env` ignored by Git.

`.env.example` (placeholders only)
```dotenv
# Runtime
NODE_ENV=development
PORT=3000

# Postgres
DB_HOST=postgres-dev
DB_PORT=5432
DB_NAME=inmeta_docs
DB_USER=__FILL_ME__
DB_PASSWORD=__FILL_ME__

# Keycloak (Auth)
KEYCLOAK_URL=https://keycloak.dynax.com.br
KEYCLOAK_REALM=inmeta
KEYCLOAK_CLIENT_ID=api-docs
KEYCLOAK_CLIENT_SECRET=__FILL_ME__

# Elasticsearch (Logs)
ELASTIC_NODE=http://elasticsearch-dev:9200
ELASTIC_USERNAME=__FILL_ME__
ELASTIC_PASSWORD=__FILL_ME__
ELASTIC_INDEX_PREFIX=api-docs

# Swagger
SWAGGER_ENABLED=true
SWAGGER_TITLE=INMETA Docs API
SWAGGER_PATH=/docs
```

Add to `.gitignore`:
```
.env
.env.*
!.env.example
```

## Local Development

```bash
# 1) Install deps
npm ci

# 2) Generate Prisma client
npx prisma generate

# 3) Create DB schema
npx prisma migrate dev --name init

# 4) Run
npm run start:dev
```

Health:
```
GET http://localhost:3000/health
```

## Database (Postgres)

- The project expects a Postgres reachable via the variables in `.env`.
- For your existing containerized Postgres (DEV), just create a new database:
  ```sql
  CREATE DATABASE inmeta_docs WITH ENCODING 'UTF8';
  ```
- Apply Prisma migrations:
  ```bash
  npx prisma migrate dev
  ```
- Explore schema:
  ```bash
  npx prisma studio
  ```

## Security (Keycloak)

The API uses Bearer tokens from Keycloak.

Obtain a token (Password flow example):
```bash
curl -X POST "$KEYCLOAK_URL/realms/$KEYCLOAK_REALM/protocol/openid-connect/token"   -H "Content-Type: application/x-www-form-urlencoded"   -d "grant_type=password&client_id=$KEYCLOAK_CLIENT_ID&client_secret=$KEYCLOAK_CLIENT_SECRET&username=<user>&password=<pass>"
```

Send requests with the token:
```bash
curl -H "Authorization: Bearer <access_token>" http://localhost:3000/employees
```

Configure role checks (scopes) per route using Nest guards and Keycloak realm/client roles.

## Logs & Observability (Elasticsearch/Kibana)

- Logs are shipped via pino with an elasticsearch transport.
- Configure via ELASTIC_* env vars.
- In Kibana (DEV): https://dev.kibana.dynax.com.br
  In Kibana (PROD): https://kibana.dynax.com.br
- Suggested index pattern: ${ELASTIC_INDEX_PREFIX}-*

Tip: add request ID correlation and include user/realm claims into log context.

## API Docs (Swagger)

- Swagger UI enabled when SWAGGER_ENABLED=true
- Default path: http://localhost:3000/docs (proxied publicly by Traefik in DEV)
- OpenAPI JSON: /docs-json

## Run with Docker

Example minimal compose for the API (DEV) assuming you already run Traefik/Keycloak/Elastic separately:

```yaml
version: "3.9"
services:
  api-dev:
    build: .
    env_file:
      - .env
    ports:
      - "3000:3000"
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.api-dev.rule=Host(`api.dev.dynax.com.br`)"
      - "traefik.http.routers.api-dev.entrypoints=websecure"
      - "traefik.http.routers.api-dev.tls=true"
      - "traefik.http.services.api-dev.loadbalancer.server.port=3000"
    networks:
      - web
networks:
  web:
    external: true
```

## Testing

```bash
npm run test
npm run test:e2e
npm run lint
```

## Production notes

- Use distinct realms/clients/secrets in Keycloak; least-privilege roles.
- Send logs to a PROD Elasticsearch with a distinct index prefix.
- Rotate secrets regularly; use a secret manager (Vault/AWS/GCP/etc.).
- Use health/readiness probes behind Traefik.
- Enable Prisma connection pooling (e.g., pgbouncer) for scale.

## License

MIT


```
CREATE DATABASE inmeta
    WITH OWNER = dinax
    ENCODING = 'UTF8'
    CONNECTION LIMIT = -1;

```