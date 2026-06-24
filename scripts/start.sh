#!/bin/sh
set -e

echo "Running database migrations..."
prisma db push --accept-data-loss

echo "Seeding database..."
prisma db seed

echo "Starting application..."
node server.js
