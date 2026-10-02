#!/usr/bin/env bash
set -e

SPEC_URL="${SPEC_URL:-http://localhost:8000/api/v1/openapi.json}"
echo "Fetching OpenAPI spec from: $SPEC_URL"

TMP_SPEC="$(mktemp /tmp/openapi_spec_XXXXXX.json)"
trap 'rm -f "$TMP_SPEC"' EXIT

if [[ "$SPEC_URL" =~ ^https?:// ]]; then
  curl -sSf "$SPEC_URL" -o "$TMP_SPEC" || {
    FALLBACK_URL="${SPEC_URL/localhost/127.0.0.1}"
    curl -sSf "$FALLBACK_URL" -o "$TMP_SPEC"
  }
else
  cp "$SPEC_URL" "$TMP_SPEC"
fi

echo "Generating TypeScript client..."
npx openapi-typescript-codegen \
  --input "$TMP_SPEC" \
  --output src \
  --client fetch \
  --useOptions
