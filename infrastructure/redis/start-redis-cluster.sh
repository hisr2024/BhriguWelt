#!/bin/bash

# BhriguWelt Redis Cluster - Quick Start Script
# This script starts the Redis cluster with all components

set -e

echo "🚀 Starting BhriguWelt Redis Infrastructure..."
echo ""

# Check if .env.redis exists
if [ ! -f ".env.redis" ]; then
    echo "❌ Error: .env.redis not found!"
    echo "   Please copy .env.redis.example to .env.redis and configure it."
    echo ""
    echo "   Quick setup:"
    echo "   cp .env.redis.example .env.redis"
    echo "   # Edit .env.redis and set REDIS_PASSWORD"
    exit 1
fi

# Load environment variables
source .env.redis

# Check if REDIS_PASSWORD is set
if [ -z "$REDIS_PASSWORD" ]; then
    echo "❌ Error: REDIS_PASSWORD not set in .env.redis"
    echo "   Generate a secure password with: openssl rand -base64 32"
    exit 1
fi

echo "✅ Configuration loaded"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running"
    echo "   Please start Docker and try again"
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Pull latest images
echo "📥 Pulling latest Redis images..."
docker-compose -f docker-compose.prod.yml pull

echo ""
echo "🚀 Starting Redis cluster..."
echo "   - Redis Master (port 6379)"
echo "   - Redis Replica (port 6380)"
echo "   - Sentinel 1-3 (ports 26379-26381)"
echo "   - Redis Exporter (port 9121)"
echo ""

# Start the cluster
docker-compose -f docker-compose.prod.yml up -d

echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 5

# Check service status
echo ""
echo "📊 Service Status:"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "🔍 Testing connections..."

# Test Redis Master
echo -n "   Redis Master: "
if docker exec bhriguwelt-redis-master redis-cli -a "$REDIS_PASSWORD" ping > /dev/null 2>&1; then
    echo "✅ PONG"
else
    echo "❌ FAILED"
fi

# Test Redis Replica
echo -n "   Redis Replica: "
if docker exec bhriguwelt-redis-replica redis-cli -a "$REDIS_PASSWORD" ping > /dev/null 2>&1; then
    echo "✅ PONG"
else
    echo "❌ FAILED"
fi

# Test Sentinel
echo -n "   Sentinel 1: "
if docker exec bhriguwelt-redis-sentinel-1 redis-cli -p 26379 ping > /dev/null 2>&1; then
    echo "✅ PONG"
else
    echo "❌ FAILED"
fi

echo ""
echo "🎉 Redis cluster started successfully!"
echo ""
echo "📝 Next steps:"
echo "   1. Check cluster status:"
echo "      docker-compose -f docker-compose.prod.yml ps"
echo ""
echo "   2. View logs:"
echo "      docker-compose -f docker-compose.prod.yml logs -f"
echo ""
echo "   3. Test Redis connection:"
echo "      docker exec -it bhriguwelt-redis-master redis-cli -a \$REDIS_PASSWORD"
echo ""
echo "   4. Check Sentinel status:"
echo "      docker exec bhriguwelt-redis-sentinel-1 redis-cli -p 26379 sentinel masters"
echo ""
echo "   5. Update backend .env with Redis configuration"
echo ""
echo "📚 For more information, see README.md and DEPLOYMENT_GUIDE.md"
echo ""
