# INMETA Docs API

![INMETA Logo](./docs/inmeta-logo.png)

_Read this in other languages: **[Português (Brasil)](README.pt-BR.md)**| **[Light Version](README.light.md)**_

API for managing employee mandatory documentation. Built with **NestJS**, **PostgreSQL (Prisma ORM)**, **Keycloak (OIDC Auth)**, **Elasticsearch + Kibana (logs/observability)**, and **Swagger**.

Public documentation (DEV): [https://dev.inmeta.dynax.com.br/docs#/](https://dev.inmeta.dynax.com.br/docs#/)

---

## Table of Contents
- [Overview](#overview)
- [Functional Specifications](#functional-specifications)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Domain Model](#domain-model)
- [Environment](#environment)
- [Local Development](#local-development)
- [Database (Postgres)](#database-postgres)
- [Authentication (Keycloak)](#authentication-keycloak)
- [Logs & Observability](#logs--observability)
- [API Docs (Swagger)](#api-docs-swagger)
- [Run with Docker](#run-with-docker)
- [Testing](#testing)
- [Production Notes](#production-notes)
- [License](#license)

---

## Overview

This service exposes a REST API to:
- Create and update employees
- Create document types
- Link/unlink document types to employees (bulk supported)
- Upload employee documents (stored via MinIO or Disk, metadata saved in DB)
- Get an employee’s documentation status (sent vs pending)
- List all documents with pagination and filters (employee, document type, status), all in this case to better utilize the endpoint and avoid generating code redundancy

---

## Functional Specifications

Example flow:

- Employee **X** is linked to two document types: **CPF** and **Work Card** → both are pending.  
- The user uploads **CPF** for employee **X** → only **Work Card** remains pending.

Implemented features:
- ✅ Employee registration & update  
- ✅ Document type registration  
- ✅ Bulk assign/unassign document types to employees  
- ✅ Document upload with storage integration (Disk or MinIO)  
- ✅ Employee documentation status endpoint (sent vs pending)  
- ✅ Paginated and filterable list of documents (employee, type, status)  

---

## Architecture

The project follows **DDD (Domain-Driven Design)** with a **Clean Architecture** approach:

```
src/
 ├─ domain/              # entities, events, services (business rules)
 ├─ infra/               # persistence (Prisma), storage, config
 ├─ modules/             # NestJS feature modules
 │   ├─ employees/       # controllers, dto, services
 │   ├─ document-types/
 │   ├─ health/
 │   └─ auth/
 ├─ common/              # decorators, interceptors, filters
 └─ main.ts              # bootstrap, global filters/pipes
```

**Justification of choices:**
- **NestJS**: modular, scalable, aligned with Clean Arch.  
- **Prisma + PostgreSQL**: type-safe ORM, migrations, developer-friendly.  
- **Keycloak**: enterprise-grade IAM with roles & JWT.  
- **Elasticsearch + Kibana**: full observability and centralized logs.  
- **Swagger**: discoverable API with schemas & examples.  
- **Docker + Traefik**: easy containerized deployment with HTTPS routing.  

---

## Tech Stack

- Node.js 20 / TypeScript  
- NestJS  
- Prisma ORM (PostgreSQL)  
- Keycloak (OIDC, JWT Bearer)  
- MinIO or Disk for file storage  
- Elasticsearch + Kibana  
- Swagger (OpenAPI 3)  
- Docker & docker-compose  
- Traefik (TLS & reverse proxy)  

---

## Domain Model

- **Employee** → id, name, cpf, hiredAt, registrationNumber, etc.  
- **DocumentType** → id, name, description, isRequired  
- **EmployeeDocument** → link table (employeeId, documentTypeId, status, sentAt)  
- **Document** → id, employeeDocumentId, filename, mimeType, storagePath, checksum, version, uploadedAt  

Business rules:
- Employee ↔ DocumentType = many-to-many with status (PENDING or SENT).  
- Upload creates new `Document` version, marks status = SENT.  
- Status endpoint aggregates sent & pending per employee.  
- Pending list supports **pagination, filtering by employee, document type, status**.  

---

## Environment

Example `.env.example`:

```dotenv
# Runtime
APP_NAME=inmeta-docs-api
NODE_ENV=development
PORT=3000

# Logging
LOG_LEVEL=debug
SWAGGER_ENABLED=true

# Database
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/inmeta?schema=public

# Keycloak
KEYCLOAK_AUTH_SERVER_URL=https://keycloak.dynax.com.br/realms/INMETA
KEYCLOAK_REALM=INMETA
KEYCLOAK_CLIENT_ID=inmeta-api
KEYCLOAK_SECRET=__FILL_ME__

# Elasticsearch
ELASTICSEARCH_NODE=http://elasticsearch-dev:9200
ELASTICSEARCH_USERNAME=__FILL_ME__
ELASTICSEARCH_PASSWORD=__FILL_ME__
ELASTICSEARCH_TLS_REJECT_UNAUTHORIZED=false
ELASTICSEARCH_LOGS_INDEX=inmeta

# Storage
STORAGE_DRIVER=disk
STORAGE_DISK_ROOT=/data/docs
UPLOAD_MAX_MB=30
ALLOWED_MIME=application/pdf,image/png,image/jpeg
```

---

## Local Development

```bash
npm ci
npx prisma generate
npx prisma migrate dev --name init
npm run start:dev
```

Health check:
```
GET http://localhost:3000/api/health
```

---

## Database (Postgres)

```sql
CREATE DATABASE inmeta
  WITH OWNER = dinax
  ENCODING = 'UTF8'
  CONNECTION LIMIT = -1;
```

---

## Authentication (Keycloak)

Request token (Password grant example):

```bash
curl -X POST "https://keycloak.dynax.com.br/realms/INMETA/protocol/openid-connect/token"   -H "Content-Type: application/x-www-form-urlencoded"   -d "client_id=inmeta-api"   -d "client_secret=__FILL_ME__"   -d "grant_type=password"   -d "username=<user>"   -d "password=<password>"
```

**⚠️ To obtain test credentials, contact the maintainer.**

Use token in API calls:
```bash
curl -H "Authorization: Bearer <access_token>" https://dev.inmeta.dynax.com.br/api/employees
```

---

## Logs & Observability

- Logs shipped to Elasticsearch.  
- Visualize in Kibana dashboards.  
- Index prefix configured via `.env`.  

![Kibana Example](./docs/kibana-example.png)

---

## API Docs (Swagger)

- Swagger enabled at: `/docs`  
- DEV public: [https://dev.inmeta.dynax.com.br/docs#/](https://dev.inmeta.dynax.com.br/docs#/)  

---

## Run with Docker

Minimal compose:

```yaml
version: "3.9"
services:
  api:
    build: .
    env_file: .env
    ports:
      - "3000:3000"
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.inmeta-api.rule=Host(`dev.inmeta.dynax.com.br`)"
      - "traefik.http.routers.inmeta-api.entrypoints=websecure"
      - "traefik.http.routers.inmeta-api.tls=true"
      - "traefik.http.services.inmeta-api.loadbalancer.server.port=3000"
    networks:
      - web
networks:
  web:
    external: true
```

---

## CI/CD (Jenkins)

The project is integrated with Jenkins pipelines for build, test, and deploy automation.

![Jenkins Example](./docs/jenkins-example.png)

---


## Testing

```bash
npm run test
npm run test:e2e
npm run lint
```

---

## Production Notes

- Use separate Keycloak clients per environment.  
- Logs to PROD Elasticsearch with unique index prefix.  
- Secrets must be rotated and stored in secret managers.  
- Enable readiness/liveness probes.  
- Use connection poolers (e.g. PgBouncer).  

---

## License

MIT
