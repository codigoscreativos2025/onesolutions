#!/bin/sh
set -e

echo "Running database migrations..."
prisma db push --skip-generate --accept-data-loss

echo "Checking database..."
tsx prisma/check-and-seed.ts

echo "Starting application..."
npm start
