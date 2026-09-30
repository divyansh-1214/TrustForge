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

The current Express routes include:

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/` | API health message |
| `POST`, `GET` | `/v1/users` | Create/list users |
| `GET` | `/v1/users/:id` | Get one user |
| `POST` | `/v1/organizations` | Create an organization |
| `GET` | `/v1/organizations/:id` | Get one organization |
| `POST`, `GET` | `/v1/members` | Create/list organization members |
| `GET` | `/v1/members/:id` | Get one member |
| `POST`, `GET` | `/v1/products` | Create/list projects |
| `POST`, `GET` | `/v1/guardrail-policies` | Create/list guardrail policies |
| `GET` | `/v1/guardrail-policies/:id` | Get one guardrail policy |
| `GET`, `POST` | `/v1/guardrail-detection-rules` | List policy rules or forward a prompt to the AI service |

Projects are exposed as `/v1/products` by the current server route. Policy list
requests accept `organization_id` as a query parameter. Detection-rule requests
accept `policy_id` as a query parameter.

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

The organization and project UUIDs must refer to existing records. In the
current Prisma schema, `project_id` is required and unique for a guardrail
policy, even though the API input validation accepts `null`; use a project UUID
for successful creation.

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