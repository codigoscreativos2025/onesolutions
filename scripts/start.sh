#!/bin/sh
set -e

# Ensure data directory and database file are writable
# (Docker volumes may have restrictive permissions)
if [ -f /app/data/dev.db ]; then
  chmod 666 /app/data/dev.db 2>/dev/null || true
fi

echo "Running database migrations..."
prisma db push --skip-generate --accept-data-loss

# Fix permissions on newly created db file
if [ -f /app/data/dev.db ]; then
  chmod 666 /app/data/dev.db 2>/dev/null || true
fi

echo "Checking database..."
tsx prisma/check-and-seed.ts

echo "Starting application..."
npm start
