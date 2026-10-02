# Collectify API

REST API for the Collectify mobile app, where users save and organize content into personal collections. Built with TypeScript, Express, Firebase Cloud Functions, Firestore and Firebase Authentication.

## Tech stack

- Node.js 20, TypeScript (strict)
- Express 5 running inside a Firebase Cloud Function (`api`, region `us-central1`)
- Firestore (Firebase Admin SDK) and Firebase Authentication
- `zod` for validation, `express-rate-limit` for abuse prevention
- Jest, `@swc/jest` and Supertest for tests

## Project structure

```
functions/src
├── index.ts                  Cloud Function entry point
├── app.ts                    Express app, global middleware
├── config/firebase.ts        Admin SDK initialization
├── routes/                   URL -> middleware -> controller mapping
├── controllers/              HTTP concerns only (params in, status + JSON out)
├── services/                 Business rules and authorization decisions
├── repositories/             Firestore access and transactions
├── middleware/               auth, validation, rate limiting, error handling
├── schemas/                  zod schemas and inferred input types
├── errors/app-error.ts       Typed application errors
└── types/                    Documents, responses and command objects
functions/test
├── unit/                     Schema tests (no emulator needed)
└── integration/              Supertest against the Firebase emulators
scripts/smoke-test.sh         End-to-end curl checks against a running emulator
docs/                         Postman collection
```

## Running locally

### Prerequisites

- Node.js 20
- Java 21 or newer (required by the Firestore emulator)
- Firebase CLI: `npm install -g firebase-tools`

### Setup

```bash
cd functions
npm install
npm run build
cd ..
firebase emulators:start --only functions,firestore,auth
```

The API is served at:

```
http://127.0.0.1:5001/papcorns-collectify-api/us-central1/api
```

The Emulator UI (Auth users and Firestore data) is available at `http://localhost:4000`. Emulator data is separate from the real Firebase project and is discarded when the emulators stop.

If you change the code, run `npm run build` again, the Functions emulator reloads the compiled output.

### Getting a token from the Auth emulator

```bash
API=http://127.0.0.1:5001/papcorns-collectify-api/us-central1/api

TOKEN=$(curl -s -X POST "http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test1234","returnSecureToken":true}' | jq -r .idToken)
```

## API

All endpoints except `GET /health` require `Authorization: Bearer <Firebase ID token>`. All request and response fields are camelCase. Timestamps are ISO 8601 strings.

| Method | Path | Description | Success |
|---|---|---|---|
| GET | `/health` | Health check, no auth | 200 |
| POST | `/collections` | Create a collection | 201 |
| GET | `/collections` | List the caller's collections (newest first) | 200 |
| GET | `/collections/:id` | Get a collection with its items | 200 |
| PUT | `/collections/:id` | Update `name` and/or `description` | 200 |
| DELETE | `/collections/:id` | Delete a collection and all its items | 204 |
| POST | `/collections/:collectionId/items` | Add an item | 201 |
| GET | `/collections/:collectionId/items` | List items (paginated, filterable) | 200 |
| PUT | `/collections/:collectionId/items/:itemId` | Update an item | 200 |
| DELETE | `/collections/:collectionId/items/:itemId` | Delete an item | 204 |

### Validation rules

- Collection `name`: 1-100 characters (trimmed), unique per user (case-insensitive). `description`: up to 500 characters, defaults to empty.
- Item `title`: 3-100 characters (trimmed), required. `priority`: `low`, `medium` or `high`, defaults to `medium`. `content`: up to 5000 characters. `url` and `imageUrl`: optional valid URLs. `tags`: up to 20 strings.
- `PUT` bodies accept a subset of fields but need at least one. Unknown fields are rejected.

### Items listing

```
GET /collections/:collectionId/items?limit=20&cursor=<itemId>&priority=high
```

`limit` is 1-100 (default 20). The response is `{ "items": [...], "nextCursor": "<id>" | null }`. Pass `nextCursor` as `cursor` to fetch the next page.

### Error format

Every error uses the same envelope:

```json
{ "error": { "code": "CONFLICT", "message": "A collection with this name already exists", "details": null } }
```

| Status | Code | When |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Invalid body or query (`details` holds the zod issues) |
| 400 | `INVALID_JSON` | Malformed JSON body |
| 401 | `UNAUTHORIZED` | Missing, malformed, invalid or expired token |
| 404 | `NOT_FOUND` | Unknown resource, or a resource owned by another user |
| 409 | `CONFLICT` | Duplicate collection name |
| 422 | `LIMIT_EXCEEDED` | More than 20 collections for one user |
| 429 | `TOO_MANY_REQUESTS` | Rate limit exceeded (300 requests per minute per IP) |
| 500 | `INTERNAL_ERROR` | Unexpected error (details are logged, not returned) |

### Example requests

```bash
curl $API/health

curl -X POST $API/collections -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"Favorite Recipes","description":"Things to cook"}'

curl $API/collections -H "Authorization: Bearer $TOKEN"

curl -X PUT $API/collections/<collectionId> -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"Tarifler"}'

curl -X POST $API/collections/<collectionId>/items -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"title":"Menemen","content":"With peppers","tags":["breakfast"],"priority":"high"}'

curl "$API/collections/<collectionId>/items?limit=10&priority=high" -H "Authorization: Bearer $TOKEN"

curl -X DELETE $API/collections/<collectionId>/items/<itemId> -H "Authorization: Bearer $TOKEN"

curl -X DELETE $API/collections/<collectionId> -H "Authorization: Bearer $TOKEN"
```

A Postman collection is available in `docs/collectify.postman_collection.json`. Set the `token` variable (see above) and optionally `baseUrl`. The create requests store `collectionId` and `itemId` automatically.

## Data model

```
collections/{collectionId}
  userId, name, description, createdAt, updatedAt
  items/{itemId}
    collectionId, userId, title, content, url?, imageUrl?, tags, priority, createdAt, updatedAt
```

## Design decisions and trade-offs

- **Layering.** Routes map URLs to controllers, controllers only translate HTTP, services own business rules and ownership checks, repositories own Firestore access. Service methods take typed command objects instead of positional arguments.
- **Rules inside transactions.** The 20-collection limit and name uniqueness must be atomic, otherwise concurrent requests could exceed them. The service defines the rules as guard functions and the repository runs them inside the Firestore transaction. The integration suite includes a concurrent-creation test for this.
- **Uniqueness without an index document.** The guard compares against the user's collections (at most 20) inside the transaction, which makes the comparison case-insensitive and avoids a separate lock document.
- **Ownership returns 404.** Another user's collection or item is indistinguishable from a missing one. Unknown routes without a token return 401 because authentication runs before routing.
- **Items as a subcollection.** Deleting a collection removes its items with `recursiveDelete`, and item queries are naturally scoped to one collection. Items also store `userId` and `collectionId`, as in the specified model.
- **camelCase everywhere.** The item model in the task description lists `created_at` and `updated_at`. The API uses `createdAt` and `updatedAt` to follow the camelCase requirement consistently.
- **Limit status code.** The task only specifies 409 for duplicate names. Exceeding the collection limit returns 422 so clients can tell the two cases apart.
- **Firestore rules deny all client access.** The API uses the Admin SDK, which bypasses rules, so clients can only reach data through the API.
- **Pagination is cursor-based** and only applied to the items list. The collection detail endpoint still returns all items of that collection, which could grow large. Collections are capped at 20 per user, so they are not paginated.
- **Rate limiting is in memory.** Each function instance keeps its own counter, so the effective limit loosens when the function scales out. A shared store such as Redis would fix this and was considered out of scope.
- **Priority filter needs a composite index** (`priority` + `createdAt`), declared in `firestore.indexes.json`.

## Tests

```bash
cd functions
npm run test:unit
npm test
```

- `npm run test:unit` runs the schema tests and needs no emulator.
- `npm test` runs unit tests, then starts the Firestore and Auth emulators for the integration tests and shuts them down afterwards (requires Java 21).
- With the emulators already running, use `npm run test:integration:running`.
- `scripts/smoke-test.sh` runs end-to-end curl checks against the running emulators (requires `curl` and `jq`).

## Deployment

Not deployed. To deploy to the Firebase project in `.firebaserc`:

```bash
firebase deploy --only functions,firestore
```

Deploying Cloud Functions generally requires the Blaze plan on the Firebase project. The base URL then has the form `https://us-central1-<project-id>.cloudfunctions.net/api`.
