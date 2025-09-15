# INMETA Docs API

![INMETA Logo](./docs/inmeta-logo.png)

_Leia em outro idioma: **[English](README.md)**| **[Light Version](README.light.md)**_

API para gerenciamento da documentação obrigatória de colaboradores. Desenvolvida com **NestJS**, **PostgreSQL (Prisma ORM)**, **Keycloak (OIDC Auth)**, **Elasticsearch + Kibana (observabilidade)** e **Swagger**.

Documentação pública (DEV): [https://dev.inmeta.dynax.com.br/docs#/](https://dev.inmeta.dynax.com.br/docs#/)

---

## Sumário
- [Visão Geral](#visão-geral)
- [Especificações Funcionais](#especificações-funcionais)
- [Arquitetura](#arquitetura)
- [Tecnologias](#tecnologias)
- [Modelo de Domínio](#modelo-de-domínio)
- [Ambiente](#ambiente)
- [Desenvolvimento Local](#desenvolvimento-local)
- [Banco de Dados (Postgres)](#banco-de-dados-postgres)
- [Autenticação (Keycloak)](#autenticação-keycloak)
- [Logs & Observabilidade](#logs--observabilidade)
- [Documentação da API (Swagger)](#documentação-da-api-swagger)
- [Execução com Docker](#execução-com-docker)
- [Testes](#testes)
- [Notas de Produção](#notas-de-produção)
- [Licença](#licença)

---

## Visão Geral

A API expõe endpoints REST para:
- Cadastrar e atualizar colaboradores
- Cadastrar tipos de documentos
- Vincular/desvincular tipos de documentos a colaboradores (suporta múltiplos)
- Enviar documentos de colaboradores (armazenados via MinIO ou Disk, metadados no banco)
- Consultar o status da documentação de um colaborador (enviado vs pendente)
- Listar todos os documentos com paginação e filtros (colaborador, tipo de documento, status), todos no caso para melhor aproveitar o end point evitando gerar redundancia de codigo

---

## Especificações Funcionais

Exemplo de fluxo:

- O colaborador **X** está vinculado aos tipos de documentos: **CPF** e **Carteira de Trabalho** → ambos pendentes.  
- O usuário envia o **CPF** → apenas **Carteira de Trabalho** permanece pendente.

Funcionalidades implementadas:
- ✅ Cadastro e atualização de colaboradores  
- ✅ Cadastro de tipos de documentos  
- ✅ Vinculação e desvinculação em massa de tipos de documentos  
- ✅ Upload de documentos com integração ao storage (Disk ou MinIO)  
- ✅ Endpoint de status da documentação de colaboradores  
- ✅ Listagem paginada e filtrável (colaborador, tipo, status)  

---

## Arquitetura

O projeto segue **DDD (Domain-Driven Design)** com **Clean Architecture**:

```
src/
 ├─ domain/              # entidades, eventos, serviços (regras de negócio)
 ├─ infra/               # persistência (Prisma), storage, config
 ├─ modules/             # módulos do NestJS
 │   ├─ employees/       # controllers, dto, services
 │   ├─ document-types/
 │   ├─ health/
 │   └─ auth/
 ├─ common/              # decorators, interceptors, filters
 └─ main.ts              # bootstrap, filtros/pipes globais
```

**Justificativas técnicas:**
- **NestJS**: modular, escalável e alinhado com Clean Arch.  
- **Prisma + PostgreSQL**: ORM type-safe, migrações, produtividade.  
- **Keycloak**: IAM robusto com suporte a papéis e JWT.  
- **Elasticsearch + Kibana**: observabilidade completa e centralizada.  
- **Swagger**: documentação amigável e interativa.  
- **Docker + Traefik**: facilidade no deploy com HTTPS roteado.  

---

## Tecnologias

- Node.js 20 / TypeScript  
- NestJS  
- Prisma ORM (PostgreSQL)  
- Keycloak (OIDC, JWT Bearer)  
- MinIO ou Disk para storage  
- Elasticsearch + Kibana  
- Swagger (OpenAPI 3)  
- Docker & docker-compose  
- Traefik (TLS & proxy reverso)  

---

## Modelo de Domínio

- **Employee** → id, name, cpf, hiredAt, registrationNumber, etc.  
- **DocumentType** → id, name, description, isRequired  
- **EmployeeDocument** → tabela de vínculo (employeeId, documentTypeId, status, sentAt)  
- **Document** → id, employeeDocumentId, filename, mimeType, storagePath, checksum, version, uploadedAt  

Regras de negócio:
- Employee ↔ DocumentType = muitos-para-muitos com status (PENDING ou SENT).  
- Upload gera nova versão em `Document` e atualiza status = SENT.  
- Endpoint de status retorna documentos enviados e pendentes por colaborador.  
- Listagem suporta **paginação, filtro por colaborador, tipo e status**.  

---

## Ambiente

Exemplo de `.env.example`:

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

## Desenvolvimento Local

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

## Banco de Dados (Postgres)

```sql
CREATE DATABASE inmeta
  WITH OWNER = dinax
  ENCODING = 'UTF8'
  CONNECTION LIMIT = -1;
```

---

## Autenticação (Keycloak)

Exemplo para obter token (Password grant):

```bash
curl -X POST "https://keycloak.dynax.com.br/realms/INMETA/protocol/openid-connect/token"   -H "Content-Type: application/x-www-form-urlencoded"   -d "client_id=inmeta-api"   -d "client_secret=__FILL_ME__"   -d "grant_type=password"   -d "username=<usuario>"   -d "password=<senha>"
```

**⚠️ Para obter credenciais de teste, entre em contato com o responsável.**

Uso do token:
```bash
curl -H "Authorization: Bearer <access_token>" https://dev.inmeta.dynax.com.br/api/employees
```

---

## Logs & Observabilidade

- Logs enviados ao Elasticsearch.  
- Visualização no Kibana.  
- Prefixo configurável via `.env`.  

![Kibana Example](./docs/kibana-example.png)
---

## Documentação da API (Swagger)

- Swagger em `/docs`  
- DEV público: [https://dev.inmeta.dynax.com.br/docs#/](https://dev.inmeta.dynax.com.br/docs#/)  

---

## Execução com Docker

Exemplo mínimo de `docker-compose`:

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

Pipeline automatizado com **Jenkins** para build, testes e deploy.

![Exemplo Jenkins](./docs/jenkins-example.png)

---

## Testes

```bash
npm run test
npm run test:e2e
npm run lint
```

---

## Notas de Produção

- Clientes distintos no Keycloak por ambiente.  
- Logs em Elasticsearch PROD com prefixo único.  
- Segredos armazenados em secret managers.  
- Probes de readiness/liveness habilitados.  
- Uso de poolers (PgBouncer).  

---

## Licença

MIT
