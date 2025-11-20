#!/usr/bin/env bash
set -euo pipefail

: "${LEAP_API_URL:?LEAP_API_URL required}"
: "${LEAP_API_KEY:?LEAP_API_KEY required}"
: "${IMAGE_REF:?IMAGE_REF required}"

echo "Deploying backend image to Leap..."
# Replace this curl with Leap's actual deploy endpoint/fields for your account.
# The payload below assumes: service name, image ref, and env set.
curl -sS -X POST "${LEAP_API_URL}/deploy" \
  -H "Authorization: Bearer ${LEAP_API_KEY}" \
  -H "Content-Type: application/json" \
  -d @- <<JSON
{
  "service": "magnus-flipper-backend",
  "image": "${IMAGE_REF}",
  "env": {
    "NODE_ENV": "production"
  },
  "replicas": 2
}
JSON

echo "Leap deploy triggered."
