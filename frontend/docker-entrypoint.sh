#!/bin/sh
set -eu

if [ -z "${BACKEND_URL:-}" ]; then
  echo "BACKEND_URL is required (e.g. http://api:8080 or https://your-api.run.app)"
  exit 1
fi

# Cloud Run routes by Host — must send the backend hostname, not the public web domain.
BACKEND_HOST=$(echo "$BACKEND_URL" | sed -e 's|^https://||' -e 's|^http://||' -e 's|/.*||')

export BACKEND_URL
export BACKEND_HOST
envsubst '${BACKEND_URL} ${BACKEND_HOST}' < /etc/nginx/nginx.conf.template > /etc/nginx/conf.d/default.conf

exec nginx -g 'daemon off;'
