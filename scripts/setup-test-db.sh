#!/bin/bash

# Test Database Setup Script for Intelli-Task-Hub
# This script sets up and migrates the test database using Docker

set -e

echo "🚀 Setting up test database for Intelli-Task-Hub..."

# Start test database container
echo "📦 Starting PostgreSQL test container..."
docker-compose -f docker-compose.test.yml up -d

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
until docker-compose -f docker-compose.test.yml exec -T test-db pg_isready -U test_user -d intellitaskhub_test; do
  echo "Waiting for postgres..."
  sleep 1
done

echo "✅ Database is ready!"

# Set test database URL
export DATABASE_URL="postgresql://test_user:test_password@localhost:5433/intellitaskhub_test"

# Run database migrations
echo "🔄 Running database migrations..."
cd lib/db
pnpm drizzle-kit push
cd ../..

echo "🎉 Test database setup complete!"
echo "🔗 Test database URL: $DATABASE_URL"
echo ""
echo "To stop the test database, run:"
echo "docker-compose -f docker-compose.test.yml down"
