#!/usr/bin/env bash
set -euo pipefail

: "${REDIS_HOST:=127.0.0.1}"
: "${REDIS_PORT:=6379}"
: "${REDIS_CLIENT_IMAGE:=redis:8.2.1-alpine}"

result=$(docker run --rm --network host "$REDIS_CLIENT_IMAGE" redis-cli --raw -h "$REDIS_HOST" -p "$REDIS_PORT" PING)
test "$result" = "PONG"
echo "Redis connectivity verification passed."
