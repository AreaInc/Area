#!/bin/bash
set -e

echo "Waiting for PostgreSQL to be ready..."
until PGPASSWORD=$POSTGRES_PASSWORD psql -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "postgres" -c '\q'; do
  >&2 echo "Postgres is unavailable - sleeping"
  sleep 1
done

echo "PostgreSQL is ready!"

# Create database if it doesn't exist
PGPASSWORD=$POSTGRES_PASSWORD psql -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "postgres" -tc "SELECT 1 FROM pg_database WHERE datname = '$POSTGRES_NAME'" | grep -q 1 || PGPASSWORD=$POSTGRES_PASSWORD psql -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "postgres" -c "CREATE DATABASE $POSTGRES_NAME"

echo "Database $POSTGRES_NAME is ready!"

# Run Drizzle migrations
echo "Running database migrations..."
npm run db:migrate

echo "Starting the application..."
exec "$@"