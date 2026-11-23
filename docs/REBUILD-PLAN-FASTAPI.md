# Backend Rebuild Plan — FastAPI

**Status:** Architecture baseline for the rebuild/fastapi-backend branch  
**Target:** Replace Laravel API and consolidate the existing algorithm service into one FastAPI application.

## 1. Decision

The backend target is Python FastAPI. The existing React 19 + TypeScript + Vite frontend and PostgreSQL 17 database remain in place.

The standalone FastAPI algorithm service is to be absorbed into the main backend process as internal Python modules. The API must call K-Means and SAW functions directly; it must not make an HTTP request to itself or retain an unnecessary second backend container.

Target stack:
- FastAPI + Uvicorn
- Pydantic v2
- SQLAlchemy 2
- Alembic
- PostgreSQL 17 + asyncpg
- JWT access tokens with explicit expiry and revocation strategy
- Pytest + HTTPX
- NumPy / scikit-learn only where justified by the existing algorithm contract

## 2. Non-goals

- Do not rewrite the React frontend or change its visual design.
- Do not replace PostgreSQL or discard existing data.
- Do not invent institutional policies, academic prerequisites, scoring criteria, weights, cluster mappings, role permissions, or application transitions.
- Do not enable recommendation ranking by default.
- Do not introduce a partner login or partner portal.
- Do not silently choose single/multiple student specialization mode.

## 3. Functional scope to preserve

The new API must provide parity for:
1. Authentication and user identity.
2. Separate roles: admin, prodi, mahasiswa, and dpm.
3. Partner CRUD and partner catalog.
4. Criteria and partner criterion scores.
5. Student specialization (DTA, PSI, SIA).
6. Course master data and student grades.
7. Recommendation readiness checks, K-Means analysis, and SAW ranking.
8. Internship applications, decision recording, and application history.
9. Private acceptance-letter upload/download.
10. DPM placement and assignment-scoped DPM read access.
11. Manual partner communication records.
12. Role dashboards and analytics.

Existing endpoint paths and JSON response contracts should be retained wherever possible so the frontend does not require a broad rewrite. Any unavoidable contract change must be documented and covered by frontend tests.

## 4. Business invariants that must not regress

- Empty prerequisites.rules means prerequisites are not configured and recommendation readiness remains blocked / not_ready.
- Recommendation activation remains disabled by default.
- Missing scores must never be silently converted to zero.
- A student can read and mutate only their own profile, grades, applications, and acceptance letter.
- A student identity, role, review metadata, application status, and storage path must be server-derived, not trusted from client payloads.
- Grade uniqueness remains one current grade per student/course; do not introduce grade history.
- Specialization mode remains unset until explicitly decided; do not select single or multiple by default.
- Admin and Prodi remain distinct roles. Do not infer that their permissions are identical.
- DPM is the Dosen Pembimbing Magang; DPM can only read assigned applications.
- Partners do not have application accounts. Communication records are manual and do not send email or change application status.
- Application decisions remain limited to menunggu -> diterima or ditolak; no reversal or extra statuses without an approved decision.
- Acceptance letters remain private, authorized, and associated with accepted applications. Replacement remains disabled unless the relevant product decision changes.
- DPM assignment remains one assignment per accepted application; replacement remains disabled.
- K-Means cluster labels must not filter SAW candidates unless a product decision explicitly defines that behavior.
- Do not add default users or production-like seed credentials.

## 5. Suggested backend layout

backend/
  pyproject.toml
  alembic.ini
  .env.example
  app/
    main.py
    core/ (config, security, errors)
    db/ (session, base)
    models/
    schemas/
    api/ (deps, router, routes)
    services/ (auth, partners, criteria, academics, recommendations, applications, acceptance_letters, dpm, communications, analytics)
    algorithms/ (kmeans, saw, readiness)
    storage/
    tests/
  migrations/

Keep routers thin. Put authorization-sensitive business operations in services and enforce ownership/role constraints in database queries as well as route dependencies.

## 6. Migration strategy

This is a replacement backend, not a destructive database reset.

1. Inventory all current Laravel migrations, models, controllers, Form Requests, policies/middleware, API Resources, routes, config, tests, and private storage behavior.
2. Produce a field-level mapping from existing PostgreSQL tables to SQLAlchemy models. Preserve table names, primary keys, foreign keys, unique constraints, nullability, indexes, and timestamps unless a documented migration requires a change.
3. Keep the current PostgreSQL schema and data intact during the initial API parity phase. Use Alembic to manage only deliberate schema changes.
4. Implement endpoint parity in vertical slices, with tests for each route and role.
5. Run contract tests against the existing frontend API calls.
6. Verify private-file migration and authorization without exposing storage paths.
7. Only after parity and acceptance tests pass, remove the Laravel runtime and old algorithm-service deployment wiring.
8. Never drop tables or reset production/development data as part of routine setup.

## 7. Delivery gates

- G0 Inventory: complete endpoint, schema, permission, file-storage, and test inventory.
- G1 Foundation: FastAPI boots, settings validation, PostgreSQL connection, health endpoint, Alembic baseline, test database.
- G2 Identity: login/me/logout, token lifecycle, role dependencies, negative authorization tests.
- G3 Master data: partners, criteria, scores, courses.
- G4 Student data: specialization, grades, ownership isolation.
- G5 Recommendations: readiness checks, K-Means analysis, SAW, no ranking when blocked.
- G6 Applications: submission, decisions, history, manual communications.
- G7 Documents and DPM: private file handling, assignment, scoped reads.
- G8 Frontend parity: run frontend tests/build and browser E2E against FastAPI.
- G9 Cutover: deployment configuration, observability, backup/restore rehearsal, remove Laravel only after acceptance.

A gate is not complete merely because code exists. It requires automated tests and recorded verification evidence.

## 8. Performance requirements

Do not assume FastAPI alone guarantees performance. Measure:
- API p50/p95 latency for health, login, list, detail, and recommendation readiness.
- Database query count and slow queries.
- Connection pool behavior under concurrent requests.
- CPU/memory use for K-Means and SAW.
- File upload/download throughput.
- Cold-start and deployment resource use.

Avoid premature caching. Add indexes based on query plans and measured workload. Use pagination for list endpoints and bounded request sizes.

## 9. Security requirements

- Validate all environment settings at startup; fail closed for missing production secrets.
- Hash passwords using Argon2id or a maintained secure password-hashing implementation.
- Sign short-lived JWT access tokens with a strong secret/key and explicit issuer/audience/expiry.
- Define logout/revocation semantics; a stateless JWT must not falsely claim immediate revocation.
- Rate-limit login and sensitive endpoints.
- Enforce role and ownership checks server-side.
- Validate uploads by content, MIME, size, and allowlist; generate storage names server-side.
- Store acceptance letters outside the public web root and stream only after authorization.
- Restrict CORS to explicit frontend origins.
- Never log passwords, tokens, document contents, or sensitive personal data.

## 10. Cutover acceptance criteria

The rebuild is acceptable only when:
- All existing frontend API flows work without broad frontend rewrites.
- Existing PostgreSQL data is retained and mapped correctly.
- Role isolation and ownership tests pass, including negative tests.
- All business invariants above are covered by tests.
- Algorithm behavior is equivalent to the current documented contract.
- Recommendation readiness remains blocked when business decisions/data are incomplete.
- Private acceptance-letter access tests pass.
- Backend, frontend, algorithm, and browser tests pass.
- Deployment and rollback procedures are documented.
- Laravel is removed only after the new backend passes the full acceptance suite.
