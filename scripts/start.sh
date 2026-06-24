#!/bin/sh
set -e

echo "Running database migrations..."
prisma db push --skip-generate --accept-data-loss

echo "Seeding database..."
tsx prisma/seed.ts

echo "Starting application..."
node server.js
