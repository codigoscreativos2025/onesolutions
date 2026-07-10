#!/bin/sh
set -e

echo "Running database migrations..."
prisma db push --skip-generate --accept-data-loss

# Ensure database file is writable (Docker volume may have restrictive permissions)
if [ -f /app/data/dev.db ]; then
  chmod 666 /app/data/dev.db 2>/dev/null || echo "Warning: Could not set permissions on dev.db"
fi

echo "Checking database..."
tsx prisma/check-and-seed.ts

echo "Starting application..."
npm start
