#!/bin/bash

# BhriguWelt Redis Cluster - Stop Script
# This script safely stops the Redis cluster

set -e

echo "🛑 Stopping BhriguWelt Redis Infrastructure..."
echo ""

# Check if docker-compose file exists
if [ ! -f "docker-compose.prod.yml" ]; then
    echo "❌ Error: docker-compose.prod.yml not found!"
    exit 1
fi

# Stop all services gracefully
echo "📊 Current service status:"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "🛑 Stopping services..."

docker-compose -f docker-compose.prod.yml stop

echo ""
echo "✅ All services stopped"
echo ""
echo "💡 To remove containers and volumes:"
echo "   docker-compose -f docker-compose.prod.yml down"
echo ""
echo "⚠️  To remove containers, volumes, AND data:"
echo "   docker-compose -f docker-compose.prod.yml down -v"
echo ""
