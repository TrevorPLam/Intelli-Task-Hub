#!/bin/bash

# Test Database Cleanup Script for Intelli-Task-Hub
# This script stops and removes the test database container

set -e

echo "🧹 Cleaning up test database..."

# Stop and remove test database container
docker-compose -f docker-compose.test.yml down

# Remove the test data volume (optional - uncomment if you want fresh data each time)
# docker volume rm intellitaskhub_test_db_data

echo "✅ Test database cleanup complete!"
