# TrustForge

TrustForge is a prototype guardrail platform for AI applications. The repository
contains a web frontend, a PostgreSQL-backed management API, and a Python service
for PII detection/masking and safety-rule processing.

## Repository layout

| Directory | Purpose | Main technologies |
| --- | --- | --- |
| `frontend/` | Web interface and API client | Next.js, React, TypeScript |
| `backend/` | Organization, project, member, and guardrail APIs | Express, TypeScript, Prisma, PostgreSQL |
| `backend-ai/` | PII detection/masking and safety service | FastAPI, Presidio, spaCy, Groq |

## Prerequisites

- Node.js and npm (Node.js 20 or newer recommended)
- Python 3.13 and [uv](https://docs.astral.sh/uv/) for the AI service
- PostgreSQL for the backend
- A Groq API key for importing/running the AI service

Run each service in a separate terminal from its own directory.

## 1. Backend API

The Express API is mounted under `/v1`. It uses PostgreSQL through Prisma's
PostgreSQL adapter.

### Configure

Create `backend/.env`:

```dotenv
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/trustforge?schema=public"
PORT=5000
FRONTEND_URL="http://localhost:3000"
```

Create the `trustforge` database first. Replace the database URL credentials
with your local PostgreSQL settings. `FRONTEND_URL` is the browser origin allowed
by the API's CORS configuration.

### Install and run

```bash
cd backend
npm ci
npx prisma generate
npx prisma db push
npm run dev
```

The development server listens at `http://localhost:5000`. `prisma db push`
applies the current Prisma schema to the development database. For production,
use a reviewed migration workflow rather than applying schema changes directly.

Useful commands:

```bash
npm run build
npm start
npx prisma validate
```

### API overview

The Express API exposes these resource routes:

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/` | API health message |
| `GET`, `POST` | `/v1/organizations` | List/create organizations |
| `GET`, `PATCH`, `DELETE` | `/v1/organizations/:id` | Read/update/delete an organization |
| `GET`, `POST` | `/v1/users` | List/create users |
| `GET`, `PATCH`, `DELETE` | `/v1/users/:id` | Read/update/delete a user |
| `GET`, `POST` | `/v1/members` | List/create organization memberships |
| `GET`, `PATCH`, `DELETE` | `/v1/members/:id` | Read/update/remove a membership |
| `GET`, `POST` | `/v1/projects` and `/v1/products` | List/create projects |
| `GET`, `PATCH`, `DELETE` | `/v1/projects/:id` and `/v1/products/:id` | Read/update/delete a project |
| `GET`, `POST` | `/v1/providers`, `/v1/models`, `/v1/provider-models` | Manage providers, models, and model aliases |
| `GET`, `PATCH`, `DELETE` | `/:id` under those provider/model routes | Read/update/delete the selected resource |
| `GET`, `POST` | `/v1/routing-rules` | List/create project routing rules |
| `GET`, `PATCH`, `DELETE` | `/v1/routing-rules/:id` | Read/update/delete a routing rule |
| `GET`, `POST` | `/v1/api-keys` | List/create organization or project API keys |
| `GET`, `PATCH`, `DELETE` | `/v1/api-keys/:id` | Read/update/revoke an API key |
| `POST`, `GET` | `/v1/guardrail-policies` | Create/list policies |
| `GET`, `PATCH`, `DELETE` | `/v1/guardrail-policies/:id` | Read/update/delete a policy and its child rules/events |
| `GET`, `POST` | `/v1/guardrail-detection-rules` | List policy rules or send a prompt to the AI safety service |
| `POST` | `/v1/guardrail-detection-rules/rules` | Create a detection rule |
| `PATCH`, `DELETE` | `/v1/guardrail-detection-rules/rules/:id` | Update/delete a detection rule |
| `GET`, `POST` | `/v1/guardrail-transformation-rules` | List/create transformation rules |
| `GET`, `PATCH`, `DELETE` | `/v1/guardrail-transformation-rules/:id` | Read/update/delete a transformation rule |
| `GET`, `POST` | `/v1/guardrail-events` | Query/create immutable guardrail events |
| `GET`, `POST` | `/v1/usage-logs` | Query/create immutable usage logs |
| `GET` | `/v1/usage-logs/:id`, `/v1/guardrail-events/:id` | Read a single usage log or guardrail event |
| `POST` | `/v1/classify` | Classify text using enabled rules for a policy |

List endpoints accept relevant relationship filters such as `organization_id`,
`project_id`, `policy_id`, `provider_id`, and `user_id`. UUID path and relation
identifiers are validated. Project-bound policies, routing rules, and API keys
are checked against their organization; usage logs also validate their
organization/project/API-key/model relationships. User responses never include
password hashes, and API-key hashes are never returned. A newly created API key
is returned once in plaintext; deleting a key revokes it rather than removing
the audit record.

The Prisma schema requires a project for each guardrail policy and permits only
one policy per project. Use an existing project UUID when creating a policy.
The `/v1/products` path remains available as a compatibility alias for projects.
Set `AI_SERVICE_URL` to override the default safety-service URL
`http://127.0.0.1:8000`.

Example policy creation request:

```http
POST /v1/guardrail-policies
Content-Type: application/json
```

```json
{
  "organization_id": "00000000-0000-4000-8000-000000000001",
  "project_id": "00000000-0000-4000-8000-000000000002",
  "name": "PII protection",
  "description": "Detect and redact personal information",
  "enabled": true,
  "guardrail_detection_rules": [
    {
      "type": "pii",
      "name": "Email detection",
      "action": "redact",
      "enabled": true,
      "threshold": 0.8,
      "config": {},
      "priority": 1
    }
  ],
  "guardrail_transformation_rules": []
}
```

The organization and project UUIDs must refer to existing records, and the
project must belong to the specified organization.

## 2. AI service

`backend-ai/` contains a FastAPI application in `server.py`. PII detection
combines regex and Presidio detectors, and masking is implemented locally.
Safety requests currently validate and sort supplied rules; the Groq classifier
integration is not yet wired into the `/safety` route.

### Configure

Create `backend-ai/.env`:

```dotenv
GROQ_API_KEY=your_groq_api_key
MODEL_NAME=your_groq_model_name
```

The Groq client is initialized when the service module loads, so set
`GROQ_API_KEY` before starting the app. Keep real credentials out of source
control.

### Install and run

```bash
cd backend-ai
uv python install 3.13
uv sync
uv run uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

The service is available at `http://localhost:8000`; interactive API docs are
at `http://localhost:8000/docs`.

Implemented endpoints:

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/` | Service status |
| `GET` | `/health` | Health status |
| `POST` | `/mask` | Detect and mask text |
| `POST` | `/unmask` | Restore text using an in-memory mapping |
| `POST` | `/safety` | Validate and sort supplied safety rules |

Example mask request:

```json
{ "text": "Contact Alex at alex@example.com" }
```

The `/unmask` mapping store is in-memory and temporary. The current `/mask`
response does not include the generated mapping request ID, so the mask/unmask
round trip needs additional API work before it can be used end-to-end.

The FastAPI CORS configuration currently allows `http://localhost:5000` (the
backend API origin).

### Tests

The AI project includes tests for regex detection and masking. With pytest
available in the environment, run:

```bash
cd backend-ai
uv run --with pytest pytest
```

## 3. Frontend

The frontend is a Next.js application. Its API client reads the backend base URL
from `NEXT_PUBLIC_BACKEND_URL`.

### Configure, install, and run

Create `frontend/.env.local`:

```dotenv
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
```

Then run:

```bash
cd frontend
npm ci
npm run dev
```

Open `http://localhost:3000`. The backend must be running and configured with
`FRONTEND_URL=http://localhost:3000` for browser API requests to pass CORS.

Useful commands:

```bash
npm run lint
npm run build
npm start
```

## Data model

The Prisma schema in `backend/prisma/schema.prisma` models organizations,
members, users, projects, API keys, guardrail policies, detection rules,
transformation rules, guardrail events, routing rules, providers, models, and
usage logs. PostgreSQL is required for the backend's Prisma adapter.

## Development notes

- Start PostgreSQL, the backend API, and the AI service before testing
  integrations between them.
- The backend forwards guardrail detection requests to
  `http://127.0.0.1:8000/safety`.
- Configure CORS origins to match the ports and hostnames used in your local or
  deployed environment.
- Do not commit `.env` files, API keys, database passwords, or other secrets.
- This repository is under active development; some API and AI workflows are
  prototypes and may change.