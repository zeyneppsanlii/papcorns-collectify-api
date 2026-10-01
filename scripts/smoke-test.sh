#!/usr/bin/env bash

API="${API:-http://127.0.0.1:5001/papcorns-collectify-api/us-central1/api}"
AUTH_URL="http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake"
RUN_ID=$(date +%s)
PASSED=0
FAILED=0

signup() {
  curl -s -X POST "$AUTH_URL" -H "Content-Type: application/json" \
    -d "{\"email\":\"$1\",\"password\":\"test1234\",\"returnSecureToken\":true}" | jq -r .idToken
}

call() {
  local method="$1" path="$2" token="$3" body="$4"
  local args=(-s -o /tmp/smoke-body -w "%{http_code}" -X "$method" "$API$path" -H "Content-Type: application/json")
  [ -n "$token" ] && args+=(-H "Authorization: Bearer $token")
  [ -n "$body" ] && args+=(-d "$body")
  STATUS=$(curl "${args[@]}")
  BODY=$(cat /tmp/smoke-body)
}

expect() {
  if [ "$STATUS" = "$2" ]; then
    PASSED=$((PASSED + 1))
    echo "PASS  $1 ($STATUS)"
  else
    FAILED=$((FAILED + 1))
    echo "FAIL  $1 (expected $2, got $STATUS) $BODY"
  fi
}

TOKEN_A=$(signup "a-$RUN_ID@example.com")
TOKEN_B=$(signup "b-$RUN_ID@example.com")

call GET /health "" ""
expect "health without token" 200

call GET /collections "" ""
expect "list without token" 401

call GET /collections "invalid" ""
expect "list with invalid token" 401

call POST /collections "$TOKEN_A" '{"name":""}'
expect "create with empty name" 400

call POST /collections "$TOKEN_A" '{"name":"Recipes","description":"food","extra":1}'
expect "create with unknown field" 400

call POST /collections "$TOKEN_A" '{"name":"Recipes","description":"food"}'
expect "create collection" 201
ID=$(echo "$BODY" | jq -r .id)

call POST /collections "$TOKEN_A" '{"name":"recipes"}'
expect "duplicate name (case-insensitive)" 409

call POST /collections "$TOKEN_B" '{"name":"Recipes"}'
expect "same name for another user" 201
ID_B=$(echo "$BODY" | jq -r .id)

call GET /collections "$TOKEN_A" ""
expect "list own collections" 200
[ "$(echo "$BODY" | jq length)" = "1" ] && echo "PASS  list contains only own data" || echo "FAIL  list leaked other user data"

call GET "/collections/$ID" "$TOKEN_A" ""
expect "get own collection" 200

call GET "/collections/$ID" "$TOKEN_B" ""
expect "get another user's collection" 404

call PUT "/collections/$ID" "$TOKEN_B" '{"name":"Hacked"}'
expect "update another user's collection" 404

call DELETE "/collections/$ID" "$TOKEN_B" ""
expect "delete another user's collection" 404

call PUT "/collections/$ID" "$TOKEN_A" '{}'
expect "update with empty body" 400

call PUT "/collections/$ID" "$TOKEN_A" '{"name":"Tarifler"}'
expect "update own collection" 200

call POST /collections "$TOKEN_A" '{"name":"Second"}'
call PUT "/collections/$(echo "$BODY" | jq -r .id)" "$TOKEN_A" '{"name":"tarifler"}'
expect "rename to existing name" 409

for i in $(seq 3 20); do
  call POST /collections "$TOKEN_A" "{\"name\":\"Filler $i\"}"
done
call POST /collections "$TOKEN_A" '{"name":"One too many"}'
expect "21st collection" 422

call DELETE "/collections/$ID" "$TOKEN_A" ""
expect "delete own collection" 204

call GET "/collections/$ID" "$TOKEN_A" ""
expect "get deleted collection" 404

call GET "/collections/$ID_B" "$TOKEN_B" ""
expect "other user's data untouched" 200

echo
echo "Passed: $PASSED  Failed: $FAILED"
[ "$FAILED" -eq 0 ]
