#!/bin/bash
set -euo pipefail

# Validate required environment variables
: "${PATRONI_SCOPE:?ERROR: PATRONI_SCOPE is required}"
: "${PATRONI_NAME:?ERROR: PATRONI_NAME is required}"
: "${PATRONI_NAMESPACE:?ERROR: PATRONI_NAMESPACE is required}"

# Process template file
if [ -f /patroni.yml.template ]; then
  envsubst < /patroni.yml.template > /patroni.yml || {
    echo "ERROR: Failed to process patroni.yml.template"
    exit 1
  }
fi

# Ensure data directory exists
mkdir -p /var/lib/postgresql/data
chown -R postgres:postgres /var/lib/postgresql

# Drop privileges and run command
if [ "$(id -u)" = '0' ]; then
  exec gosu postgres "$@"
else
  exec "$@"
fi
