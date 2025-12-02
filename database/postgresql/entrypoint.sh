#!/bin/sh
set -e

if [ -f /patroni.yml.template ]; then
  envsubst < /patroni.yml.template > /patroni.yml
fi

mkdir -p /var/lib/postgresql/data
chown -R postgres:postgres /var/lib/postgresql

if [ "$(id -u)" = '0' ]; then
  exec su -s /bin/sh postgres -c "$*"
else
  exec "$@"
fi
