ChessHub Copilot Instructions

These rules apply to all code Copilot generates in this repository.
Follow them consistently across backend (FastAPI) and frontend (React+TypeScript).
Remember i am using vs code in windows so the commands and paths should be windows compatible.use correct powershell syntax
always look for backedn.md for api endpoints and models and schemas and authentication and other backend details like response formats and business logic 
we have match tiebreakers for ties in knockout matches also ties in stadnings and best players dont get confused between them
if something is missing or unclear check the backend code directly
1. Project Architecture
Backend (FastAPI + SQLAlchemy + PostgreSQL)

Entry Point: backend/app/main.py

Database: PostgreSQL via backend/app/database.py

Models: Domain models in backend/app/models.py with strict relationships:
Tournament → Teams → Players → Matches → Games

Business Logic: Tournament algorithms in backend/app/utilities/tournament.py (pairings, standings, tiebreakers)

Auth: JWT auth in backend/app/utilities/auth.py

Routers: Modular under backend/app/api/ (tournaments, teams, players, matches, auth)

Schemas: Pydantic schemas in backend/app/schemas.py (must match exactly in responses)

Frontend (React + TypeScript + Vite)

Entry Point: frontend/src/App.tsx

Routing & State: React Router + TanStack Query

API Layer: frontend/src/services/api.ts (axios interceptors handle JWT injection)

Types: Centralized in frontend/src/types/index.ts (must mirror backend Pydantic schemas)

Hooks: frontend/src/hooks/ (e.g., useTournament, useAuth)

UI Components: frontend/src/components/ with TailwindCSS

2. Naming & Conventions

Models: PascalCase (Tournament, Match, Player)

Functions & Vars: camelCase (generatePairings, calculateStandings)

Files: kebab-case (tournament-service.ts, match-router.py)

API Endpoints: All prefixed with /api/ (/api/tournaments, /api/matches)

Responses: Always JSON with keys status, data, error

Never invent schema fields or endpoint names. Always use what exists in:

backend/app/models.py

backend/app/schemas.py

frontend/src/types/index.ts

3. Authentication

Backend: JWT-based. Login returns:

{
  "access_token": "string",
  "token_type": "bearer",
  "user": { ... }
}


Frontend: Axios interceptors must inject Authorization: Bearer <token> automatically.

Never bypass Depends(get_current_user) on protected endpoints.

4. API & Business Logic

Response Format:

Lists include pagination metadata.

Single resources return full object graphs.

Tournament Logic:

Respect enums from backend/app/enums.py.

Implement Swiss, round-robin, knockout logic via utilities/tournament.py.

Always handle edge cases: byes, draws, ties.

Cascading Deletes: Ensure tournaments remove teams, players, matches consistently.

5. Frontend Rules

Use functional components with hooks only.

Use TypeScript with strict typing.

Use TailwindCSS for styling.

State management via TanStack Query, not manual global stores.

Props drilling for UI state, React Context only for auth state.

Always match TypeScript types to backend schemas.

6. Testing & Debugging
Backend

Unit test tournament logic in backend/app/utilities/test_tournament.py.

Use FastAPI /docs for live API testing when DEBUG=true.

Frontend

Use React DevTools and TanStack Query DevTools.

Use Jest for unit tests, Playwright for e2e.

Write test names as behavior-driven (should return 401 if unauthenticated).

7. Security & Reliability

Never log secrets (tokens, passwords).

Always hash passwords (bcrypt).

Validate input with Pydantic (backend) and Zod (frontend).

All secrets loaded from .env (never hardcode).

Always handle async errors with try/catch (backend and frontend).
8. Copilot Agent Mode Instructions
These instructions ensure Copilot Agent Mode works as a careful, professional assistant. Copilot must use backend.md and the actual backend code as reference before making changes. The goal is to maintain correctness, clarity, and professionalism while supporting frontend and backend integration.

Core Principles

Backend Reference First

Always read backend.md for API endpoints, models, schemas, authentication, and other backend details.

If details are missing or unclear, check the backend code directly.

Never guess functionality. Confirm before acting.

Deep Understanding Before Action

Fully understand the existing code and its purpose before editing.

Consider the data flow, dependencies, and impact on frontend.

If unsure, ask the developer for clarification before proceeding.

Do Not Break the Website

Never change the actual content or functionality of the site unless explicitly requested.

Avoid introducing breaking changes.

Respect existing user-facing behavior and design.

Code Quality & Professionalism

Keep code clean, consistent, and easy to understand.

Follow existing project conventions (naming, formatting, imports, etc.).

Add short, clear comments for non-trivial logic.

Ensure all changes are production-ready.

Communication & Questions

Always ask the developer if something is ambiguous or missing.

Confirm with the developer before implementing larger structural or functional changes.

Never make assumptions about requirements.

Documentation Alignment

Keep backend.md accurate and up-to-date with any API, schema, or logic changes.

Ensure frontend developers can rely on backend.md as a single source of truth.

Workflow for Copilot Agent Mode

Check Docs: Read backend.md first.

Verify in Code: Cross-check details with backend source code.

Clarify: Ask developer if unclear about purpose or impact.

Propose Carefully: Suggest clean, minimal, professional changes.

Do No Harm: Confirm no existing site content or functionality is altered.

Update Docs: Reflect changes in backend.md when necessary.