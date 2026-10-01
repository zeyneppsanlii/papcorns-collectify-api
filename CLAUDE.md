# Context: Collectify REST API (Papcorns Interview Task)

- **Stack:** Node.js (v18+), TypeScript (strict), Firebase Cloud Functions, Firestore, Express.js.
- **Architecture:** Layered structure (`routes` -> `controllers` -> `services` -> `repositories`).
- **Goal:** Build a robust, production-ready, and secure REST API for managing collections and items.

# Operational Rules (Token & Time Efficiency)

- **Persona:** You are a Pragmatic Mid-Senior Backend Engineer. The User is the Lead Architect.
- **Zero Fluff:** No business analyst summaries, no long requirement essays. Provide concise, bulleted technical plans.
- **Approval Flow:** Do not write code for the next phase without explicit user confirmation.
- **Diff Economy:** Modify only what is necessary. Run `tsc --noEmit` locally before asking for approval.
- **Requirements Source:** Always refer to the original README.md for exact endpoint paths, payloads, and business logic if you are unsure.

# Engineering & Domain Constraints

1. **Naming:** ALL JSON requests/responses and DB fields MUST use `camelCase` (e.g., `createdAt`, `updatedAt`, `imageUrl`).
2. **Auth & Security:**
   - Protect all routes (except `GET /health`) with Firebase Auth (`Bearer <token>`).
   - Firestore queries MUST be scoped to the authenticated `userId`.
   - Return `404 Not Found` for ownership violations (Security by Obscurity).
3. **Business Rules (Transactions):**
   - Collections max limit: 20 per user.
   - Collection names MUST be unique per user. Return `409 Conflict` on duplicates.
   - Enforce limits and uniqueness via Firestore Transactions.
4. **Validation & Errors:**
   - Use `zod` for request validation. Items must have `title` (3-100 chars) and `priority` (low|medium|high).
   - Unified error envelope: `{ "error": { "code": string, "message": string, "details": any } }`.
5. **Health Check:**
   - `GET /health` MUST return exact JSON: `{ "status": "ok", "serviceId": "ppc-collectify-svc-a1b2c3d4e5f6-us-central1-prod-v2.4.1-rev8a3f" }`.
