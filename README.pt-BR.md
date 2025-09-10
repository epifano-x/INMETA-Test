# Teste INMETA – Back-End (Node.js + TypeScript)

_Leia em outros idiomas: **[English](README.md)**_

API para gerenciar a documentação obrigatória de colaboradores. Projeto preparado para deploy real com NestJS, PostgreSQL, Keycloak (autenticação/autorização), Elasticsearch + Kibana (logs/observabilidade) e Swagger (documentação).

Observação: não versionamos segredos no Git. Use `.env` localmente e segredos no pipeline. Veja Ambiente abaixo.

---

## Sumário
- [Visão Geral](#visão-geral)
- [Arquitetura](#arquitetura)
- [Tecnologias](#tecnologias)
- [Modelo de Domínio](#modelo-de-domínio)
- [Ambiente](#ambiente)
- [Desenvolvimento Local](#desenvolvimento-local)
- [Banco de Dados (Postgres)](#banco-de-dados-postgres)
- [Segurança (Keycloak)](#segurança-keycloak)
- [Logs & Observabilidade (Elasticsearch/Kibana)](#logs--observabilidade-elasticsearchkibana)
- [Documentação da API (Swagger)](#documentação-da-api-swagger)
- [Executar com Docker](#executar-com-docker)
- [Testes](#testes)
- [Notas de Produção](#notas-de-produção)
- [Licença](#licença)

---

## Visão Geral

A API expõe endpoints para:
- Criar/atualizar colaboradores
- Cadastrar tipos de documento
- Vincular/desvincular tipos de documento a colaboradores (em lote)
- Enviar documentos (apenas metadados; não é necessário upload real)
- Obter o status de toda a documentação de um colaborador (enviados vs pendentes)
- Listar documentos pendentes com paginação e filtros (colaborador / tipo)

## Arquitetura

```
apps/api
 ├─ src
 │   ├─ main.ts                 # bootstrap + pipes/filtros globais + logging
 │   ├─ app.module.ts
 │   ├─ modules/
 │   │   ├─ employees/
 │   │   ├─ document-types/
 │   │   ├─ documents/
 │   │   └─ health/
 │   ├─ common/
 │   │   ├─ auth/ (guards do Keycloak, roles, scopes)
 │   │   ├─ logging/ (pino + transporte para Elasticsearch)
 │   │   └─ dto/
 │   └─ infra/
 │       ├─ prisma/ (schema + migrations)
 │       └─ config/
 ├─ prisma/ (schema.prisma, migrations)
 └─ test/
```

- Framework: NestJS (Express) + Class-Validator
- Auth: Keycloak (OpenID Connect); JWT Bearer nas rotas protegidas
- DB: PostgreSQL via Prisma
- Logs: Pino → Elasticsearch (indexados), visualização no Kibana
- Docs: Swagger em `/docs`
- Empacotamento: Docker; proxy reverso com Traefik

## Tecnologias

- Node.js 20 / TypeScript
- NestJS
- Prisma ORM (PostgreSQL)
- Keycloak (OIDC)
- Pino + pino-elasticsearch (logs) / alternativa Elastic APM
- Swagger (OpenAPI 3)
- Docker / docker-compose
- Traefik (TLS/roteamento)

## Modelo de Domínio

Entidades sugeridas (adapte conforme necessário):

- Employee
  - id, name, cpf, hiredAt
- DocumentType
  - id, name
- Document
  - id, name, status (PENDING | SENT)
  - employeeId, documentTypeId
  - submittedAt

Regras:
- Vincular/desvincular múltiplos tipos de uma vez
- Enviar documento altera status para SENT
- Endpoint de status retorna enviados e pendentes
- Lista de pendentes com paginação e filtros

## Ambiente

Crie seu `.env` a partir do template e não faça commit de segredos. Mantenha `.env` ignorado pelo Git.

`.env.example` (apenas placeholders)
```dotenv
# Runtime
NODE_ENV=development
PORT=3000

# Postgres
DB_HOST=postgres-dev
DB_PORT=5432
DB_NAME=inmeta_docs
DB_USER=__PREENCHA__
DB_PASSWORD=__PREENCHA__

# Keycloak (Auth)
KEYCLOAK_URL=https://keycloak.dynax.com.br
KEYCLOAK_REALM=inmeta
KEYCLOAK_CLIENT_ID=api-docs
KEYCLOAK_CLIENT_SECRET=__PREENCHA__

# Elasticsearch (Logs)
ELASTIC_NODE=http://elasticsearch-dev:9200
ELASTIC_USERNAME=__PREENCHA__
ELASTIC_PASSWORD=__PREENCHA__
ELASTIC_INDEX_PREFIX=api-docs

# Swagger
SWAGGER_ENABLED=true
SWAGGER_TITLE=INMETA Docs API
SWAGGER_PATH=/docs
```

Adicionar no `.gitignore`:
```
.env
.env.*
!.env.example
```

## Desenvolvimento Local

```bash
# 1) Instalar dependências
npm ci

# 2) Gerar client do Prisma
npx prisma generate

# 3) Criar schema no banco
npx prisma migrate dev --name init

# 4) Rodar
npm run start:dev
```

Health:
```
GET http://localhost:3000/health
```

## Banco de Dados (Postgres)

- A aplicação lê as variáveis do `.env` para conectar.
- No seu Postgres em contêiner (DEV), crie um banco novo:
  ```sql
  CREATE DATABASE inmeta_docs WITH ENCODING 'UTF8';
  ```
- Aplique as migrations do Prisma:
  ```bash
  npx prisma migrate dev
  ```
- Explorar schema:
  ```bash
  npx prisma studio
  ```

## Segurança (Keycloak)

A API usa tokens Bearer do Keycloak.

Obter token (exemplo fluxo de senha):
```bash
curl -X POST "$KEYCLOAK_URL/realms/$KEYCLOAK_REALM/protocol/openid-connect/token"   -H "Content-Type: application/x-www-form-urlencoded"   -d "grant_type=password&client_id=$KEYCLOAK_CLIENT_ID&client_secret=$KEYCLOAK_CLIENT_SECRET&username=<usuario>&password=<senha>"
```

Chamar a API com token:
```bash
curl -H "Authorization: Bearer <access_token>" http://localhost:3000/employees
```

Roles e escopos são validados por guards do NestJS.

## Logs & Observabilidade (Elasticsearch/Kibana)

- Logs via pino com transporte para Elasticsearch.
- Configure via variáveis ELASTIC_*.
- Kibana DEV: https://dev.kibana.dynax.com.br
  Kibana PROD: https://kibana.dynax.com.br
- Padrão de índice sugerido: ${ELASTIC_INDEX_PREFIX}-*

Dica: inclua um correlation id e claims do usuário no contexto dos logs.

## Documentação da API (Swagger)

- Ativado quando SWAGGER_ENABLED=true
- UI: http://localhost:3000/docs
- OpenAPI JSON: /docs-json

## Executar com Docker

Compose mínimo para a API (DEV), assumindo Traefik/Keycloak/Elastic externos:

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

## Testes

```bash
npm run test
npm run test:e2e
npm run lint
```

## Notas de Produção

- Realms/clients/secrets distintos no Keycloak; least-privilege sempre.
- Logs em ES de PROD com prefixo de índice diferente do DEV.
- Rotacione segredos regularmente; use cofre de segredos.
- Health/readiness probes atrás do Traefik.
- Pooling de conexões do Prisma (ex.: pgbouncer) para escala.

## Licença

MIT
