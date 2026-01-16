# BhriguWelt Redis Infrastructure - Deployment Guide

Complete step-by-step guide to deploy the enterprise-grade Redis infrastructure for BhriguWelt.

## 📋 Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Local Development Setup](#local-development-setup)
3. [Production Deployment](#production-deployment)
4. [Post-Deployment Verification](#post-deployment-verification)
5. [Maintenance & Operations](#maintenance--operations)
6. [Rollback Procedures](#rollback-procedures)

---

## 🔍 Pre-Deployment Checklist

Before deploying, ensure you have:

- [ ] Docker 20.10+ installed
- [ ] Docker Compose 2.0+ installed
- [ ] At least 4GB RAM available
- [ ] At least 10GB disk space
- [ ] Network ports available: 6379, 6380, 26379-26381, 9121
- [ ] Backup of existing Redis data (if upgrading)
- [ ] Generated secure Redis password (minimum 32 characters)
- [ ] Read and understood the architecture in README.md

## 🏠 Local Development Setup

### Step 1: Clone and Navigate

```bash
cd /home/user/BhriguWelt/infrastructure/redis
```

### Step 2: Configure Environment

```bash
# Copy example environment file
cp .env.redis.example .env.redis

# Generate secure Redis password
openssl rand -base64 32

# Edit environment file
nano .env.redis
```

Minimal configuration for development:

```bash
# .env.redis
REDIS_PASSWORD=<your-generated-password>
REDIS_USE_SENTINEL=false  # Use false for local dev
ENABLE_REDIS_MONITORING=true
ENABLE_AI_QUOTA=true
```

### Step 3: Start Redis Locally

For simple local development (single Redis instance):

```bash
# Start just Redis master
docker run -d \
  --name bhriguwelt-redis-dev \
  -p 6379:6379 \
  -v redis_dev_data:/data \
  redis:7.2-alpine \
  redis-server --requirepass "YOUR_PASSWORD"
```

For testing HA (full cluster):

```bash
# Start full cluster with Sentinel
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be healthy (~30 seconds)
sleep 30

# Verify all services are running
docker-compose -f docker-compose.prod.yml ps
```

### Step 4: Configure Backend

Update `backend/.env`:

```bash
# Add these Redis configuration variables
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=<your-password>
REDIS_USE_SENTINEL=false
REDIS_MAX_CONNECTIONS=20
ENABLE_CACHING=true
ENABLE_AI_QUOTA=true
ENABLE_REDIS_MONITORING=true
```

### Step 5: Test Connection

```python
# Create test script: test_redis_connection.py
from services.enterprise_redis_client import enterprise_redis_client

# Test connection
health = enterprise_redis_client.get_health_status()
print(f"Redis Status: {health}")

# Test operations
enterprise_redis_client.set('test_key', 'test_value', ex=60)
value = enterprise_redis_client.get('test_key')
print(f"Test Value: {value}")

# Get stats
stats = enterprise_redis_client.get_stats()
print(f"Stats: {stats}")
```

```bash
# Run test
cd backend
python test_redis_connection.py
```

Expected output:
```
Redis Status: {'status': 'healthy', 'connected': True, ...}
Test Value: test_value
Stats: {'operations': {...}, 'connection': {...}}
```

---

## 🚀 Production Deployment

### Phase 1: Infrastructure Setup (Day 1 - Hour 1-2)

#### 1.1 Prepare Production Environment

```bash
# SSH to production server
ssh user@production-server

# Create directory structure
sudo mkdir -p /opt/bhriguwelt/redis
sudo mkdir -p /opt/bhriguwelt/redis/data
sudo chown -R $USER:$USER /opt/bhriguwelt

# Navigate to project
cd /opt/bhriguwelt
```

#### 1.2 Configure Production Environment

```bash
# Copy infrastructure files
cd /opt/bhriguwelt/redis
cp .env.redis.example .env.redis

# Generate strong production password
REDIS_PASSWORD=$(openssl rand -base64 48)
echo "REDIS_PASSWORD (SAVE THIS SECURELY): $REDIS_PASSWORD"

# Edit .env.redis with production values
nano .env.redis
```

Production `.env.redis`:

```bash
# ============ PRODUCTION CONFIGURATION ============

# Redis Authentication
REDIS_PASSWORD=<your-48-char-password>

# Redis Configuration
REDIS_HOST=redis-master
REDIS_PORT=6379
REDIS_DB=0

# High Availability (CRITICAL for production)
REDIS_USE_SENTINEL=true
REDIS_SENTINEL_MASTER=bhriguwelt-master
REDIS_SENTINEL_HOSTS=redis-sentinel-1:26379,redis-sentinel-2:26379,redis-sentinel-3:26379

# Connection Pool (adjust based on load)
REDIS_MAX_CONNECTIONS=100
REDIS_SOCKET_TIMEOUT=5.0
REDIS_CONNECT_TIMEOUT=5.0

# Performance
REDIS_DEFAULT_TTL=3600
REDIS_HEALTH_CHECK_INTERVAL=30
REDIS_MAX_MEMORY_MB=1024

# Monitoring (REQUIRED for production)
ENABLE_REDIS_MONITORING=true
REDIS_ALERT_CONNECTION_FAILURES=5
REDIS_ALERT_MEMORY_PERCENT=85
REDIS_ALERT_CPU_PERCENT=80
REDIS_ALERT_RESPONSE_TIME=500
REDIS_ALERT_HIT_RATE_MIN=80

# AI Quotas
ENABLE_AI_QUOTA=true
DEFAULT_QUOTA_TIER=free

# Caching
ENABLE_CACHING=true

# Environment
ENVIRONMENT=production
APP_NAME=bhriguwelt
```

#### 1.3 Deploy Redis Cluster

```bash
# Load environment variables
source .env.redis

# Start Redis cluster
docker-compose -f docker-compose.prod.yml up -d

# Monitor startup logs
docker-compose -f docker-compose.prod.yml logs -f

# Wait for all services to be healthy (Ctrl+C to exit logs after ~60 seconds)
```

#### 1.4 Verify Cluster Health

```bash
# Check all containers are running
docker-compose -f docker-compose.prod.yml ps

# Expected output:
# NAME                           STATUS    PORTS
# bhriguwelt-redis-master        Up        0.0.0.0:6379->6379/tcp
# bhriguwelt-redis-replica       Up        0.0.0.0:6380->6379/tcp
# bhriguwelt-redis-sentinel-1    Up        0.0.0.0:26379->26379/tcp
# bhriguwelt-redis-sentinel-2    Up        0.0.0.0:26380->26379/tcp
# bhriguwelt-redis-sentinel-3    Up        0.0.0.0:26381->26379/tcp
# bhriguwelt-redis-exporter      Up        0.0.0.0:9121->9121/tcp

# Test Redis master
docker exec bhriguwelt-redis-master redis-cli -a "$REDIS_PASSWORD" ping
# Expected: PONG

# Check Sentinel status
docker exec bhriguwelt-redis-sentinel-1 redis-cli -p 26379 sentinel masters
# Should show bhriguwelt-master with status "ok"

# Test replication
docker exec bhriguwelt-redis-master redis-cli -a "$REDIS_PASSWORD" INFO replication
# Should show: role:master, connected_slaves:1
```

### Phase 2: Backend Integration (Day 1 - Hour 3-4)

#### 2.1 Update Backend Environment

```bash
# Update backend .env file
cd /opt/bhriguwelt/backend
nano .env
```

Add Redis configuration:

```bash
# ============ REDIS CONFIGURATION ============

# Redis Connection
REDIS_HOST=redis-master
REDIS_PORT=6379
REDIS_PASSWORD=<same-password-from-redis-env>
REDIS_DB=0

# High Availability
REDIS_USE_SENTINEL=true
REDIS_SENTINEL_MASTER=bhriguwelt-master
REDIS_SENTINEL_HOSTS=redis-sentinel-1:26379,redis-sentinel-2:26379,redis-sentinel-3:26379

# Connection Pool
REDIS_MAX_CONNECTIONS=100
REDIS_SOCKET_TIMEOUT=5.0
REDIS_CONNECT_TIMEOUT=5.0

# Cache Settings
ENABLE_CACHING=true
REDIS_DEFAULT_TTL=3600

# AI Quota
ENABLE_AI_QUOTA=true
USER_DAILY_TOKEN_LIMIT=100000

# Monitoring
ENABLE_REDIS_MONITORING=true

# Celery (Task Queue)
CELERY_BROKER_URL=redis://:${REDIS_PASSWORD}@redis-master:6379/0
CELERY_RESULT_BACKEND=redis://:${REDIS_PASSWORD}@redis-master:6379/0
```

#### 2.2 Deploy Backend with Redis Support

```bash
# Rebuild backend Docker image with new dependencies
cd /opt/bhriguwelt
docker-compose -f docker-compose.production.yml build backend_1 backend_2

# Restart backend services
docker-compose -f docker-compose.production.yml up -d backend_1 backend_2

# Monitor backend logs
docker-compose -f docker-compose.production.yml logs -f backend_1 backend_2

# Look for successful Redis connection messages:
# ✅ Redis connection established (mode: sentinel)
# ✅ AI Quota service initialized
# ✅ Redis monitoring initialized
```

### Phase 3: Post-Deployment Verification (Day 1 - Hour 5)

#### 3.1 Verify Backend-Redis Integration

```bash
# Test health endpoint
curl http://localhost:8000/health

# Should include Redis status:
# {
#   "status": "healthy",
#   "redis": {
#     "connected": true,
#     "mode": "sentinel",
#     ...
#   }
# }

# Test Redis health endpoint
curl http://localhost:8000/api/redis/health

# Test quota system
curl -X POST http://localhost:8000/api/bhrigu-predictions/karmic-journey \
  -H "Content-Type: application/json" \
  -d '{
    "birth_data": {
      "zodiac_sign": "Leo",
      "moon_sign": "Cancer"
    }
  }'

# Verify quota was tracked in Redis
docker exec bhriguwelt-redis-master redis-cli -a "$REDIS_PASSWORD" KEYS "quota:*"
```

#### 3.2 Load Testing

```bash
# Install Apache Bench if not available
sudo apt-get install apache2-utils

# Run load test (100 requests, 10 concurrent)
ab -n 100 -c 10 \
  -H "Content-Type: application/json" \
  -p test_payload.json \
  http://localhost:8000/api/bhrigu-predictions/karmic-journey

# Monitor Redis during load test
docker exec bhriguwelt-redis-master redis-cli -a "$REDIS_PASSWORD" --stat
```

#### 3.3 Failover Testing

```bash
# Test automatic failover
echo "Current master:"
docker exec bhriguwelt-redis-sentinel-1 redis-cli -p 26379 \
  sentinel get-master-addr-by-name bhriguwelt-master

# Stop master
docker stop bhriguwelt-redis-master

# Wait for failover (5-10 seconds)
sleep 10

# Check new master (should be replica now)
echo "New master after failover:"
docker exec bhriguwelt-redis-sentinel-1 redis-cli -p 26379 \
  sentinel get-master-addr-by-name bhriguwelt-master

# Verify application still works
curl http://localhost:8000/health

# Restart old master (it will become a replica)
docker start bhriguwelt-redis-master
```

### Phase 4: Monitoring Setup (Day 1 - Hour 6)

#### 4.1 Configure Prometheus (Optional)

```bash
# Create Prometheus config
cd /opt/bhriguwelt/monitoring
nano prometheus.yml
```

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'redis'
    static_configs:
      - targets: ['localhost:9121']

  - job_name: 'bhriguwelt-backend'
    static_configs:
      - targets: ['localhost:8000']
```

```bash
# Start Prometheus
docker run -d \
  --name bhriguwelt-prometheus \
  -p 9090:9090 \
  -v $(pwd)/prometheus.yml:/etc/prometheus/prometheus.yml \
  prom/prometheus
```

#### 4.2 Configure Grafana (Optional)

```bash
# Start Grafana
docker run -d \
  --name bhriguwelt-grafana \
  -p 3001:3000 \
  -e "GF_SECURITY_ADMIN_PASSWORD=admin" \
  grafana/grafana

# Access Grafana at http://your-server:3001
# Login: admin / admin
# Add Prometheus data source: http://localhost:9090
# Import Redis dashboard: ID 11835
```

#### 4.3 Set Up Alerts

Configure alert notifications (email, Slack, etc.) in your application:

```python
# In your application monitoring code
from services.redis_monitor import redis_monitor

# Schedule periodic monitoring (every minute)
@scheduler.task('interval', id='redis_monitoring', seconds=60)
def monitor_redis():
    metrics = redis_monitor.collect_metrics()
    alerts = redis_monitor.check_alerts()

    # Send critical alerts to Slack/email
    for alert in alerts:
        if alert.severity == 'critical':
            send_alert_notification(alert)
```

---

## ✅ Post-Deployment Verification

### Verification Checklist

Run through this checklist after deployment:

```bash
#!/bin/bash
# save as verify_deployment.sh

echo "=== BhriguWelt Redis Deployment Verification ==="

# 1. Check Redis master
echo -n "1. Redis Master Status: "
docker exec bhriguwelt-redis-master redis-cli -a "$REDIS_PASSWORD" ping

# 2. Check Redis replica
echo -n "2. Redis Replica Status: "
docker exec bhriguwelt-redis-replica redis-cli -a "$REDIS_PASSWORD" ping

# 3. Check Sentinel
echo "3. Sentinel Status:"
docker exec bhriguwelt-redis-sentinel-1 redis-cli -p 26379 sentinel masters | grep -E "name|status|flags"

# 4. Check replication
echo "4. Replication Status:"
docker exec bhriguwelt-redis-master redis-cli -a "$REDIS_PASSWORD" INFO replication | grep -E "role|connected_slaves"

# 5. Test data persistence
echo "5. Testing data persistence:"
docker exec bhriguwelt-redis-master redis-cli -a "$REDIS_PASSWORD" SET deployment_test "$(date)"
sleep 1
docker exec bhriguwelt-redis-master redis-cli -a "$REDIS_PASSWORD" GET deployment_test

# 6. Check backend health
echo "6. Backend Health:"
curl -s http://localhost:8000/health | jq '.redis'

# 7. Check Redis exporter
echo "7. Redis Exporter Metrics:"
curl -s http://localhost:9121/metrics | head -n 5

# 8. Check monitoring
echo "8. Monitoring Dashboard:"
curl -s http://localhost:8000/api/redis/health | jq '.status'

echo "=== Verification Complete ==="
```

```bash
# Make executable and run
chmod +x verify_deployment.sh
./verify_deployment.sh
```

### Expected Results

All checks should pass:
- ✅ Redis Master: PONG
- ✅ Redis Replica: PONG
- ✅ Sentinel: status=ok
- ✅ Replication: connected_slaves=1
- ✅ Data Persistence: Value retrieved
- ✅ Backend: redis.connected=true
- ✅ Exporter: Metrics available
- ✅ Monitoring: status=healthy

---

## 🔧 Maintenance & Operations

### Daily Operations

```bash
# Check cluster health
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs --tail=100 redis-master

# Check memory usage
docker exec bhriguwelt-redis-master redis-cli -a "$REDIS_PASSWORD" INFO memory

# Monitor live operations
docker exec bhriguwelt-redis-master redis-cli -a "$REDIS_PASSWORD" MONITOR
```

### Backups

```bash
# Manual backup
docker exec bhriguwelt-redis-master redis-cli -a "$REDIS_PASSWORD" SAVE

# Copy backup file
docker cp bhriguwelt-redis-master:/data/dump.rdb ./backup-$(date +%Y%m%d-%H%M%S).rdb

# Automated backups (add to crontab)
0 2 * * * /opt/bhriguwelt/redis/backup_redis.sh
```

### Scaling

#### Vertical Scaling (More Resources)

Edit `docker-compose.prod.yml`:

```yaml
deploy:
  resources:
    limits:
      memory: 2G  # Increase from 1G
      cpus: '2.0'  # Increase from 1.0
```

Update Redis config:

```conf
# redis.conf
maxmemory 2gb  # Increase from 512mb
```

#### Horizontal Scaling (More Replicas)

Add more replicas to `docker-compose.prod.yml`:

```yaml
redis-replica-2:
  image: redis:7.2-alpine
  command: redis-server --replicaof redis-master 6379 --masterauth ${REDIS_PASSWORD}
  # ... same config as redis-replica
```

---

## 🔄 Rollback Procedures

### Rollback Plan

If issues occur, follow this rollback procedure:

#### 1. Immediate Rollback (< 5 minutes)

```bash
# Stop new Redis cluster
cd /opt/bhriguwelt/redis
docker-compose -f docker-compose.prod.yml down

# Restore old Redis
docker start old-redis-container  # Or restore from backup

# Revert backend environment
cd /opt/bhriguwelt/backend
git checkout HEAD~1 .env  # Or restore from backup

# Restart backend
docker-compose -f docker-compose.production.yml restart backend_1 backend_2
```

#### 2. Data Recovery (if needed)

```bash
# Stop Redis
docker-compose -f docker-compose.prod.yml stop redis-master

# Restore backup
docker cp ./backup-YYYYMMDD-HHMMSS.rdb bhriguwelt-redis-master:/data/dump.rdb

# Start Redis
docker-compose -f docker-compose.prod.yml start redis-master

# Verify data
docker exec bhriguwelt-redis-master redis-cli -a "$REDIS_PASSWORD" DBSIZE
```

#### 3. Complete Rollback Checklist

- [ ] Stop new Redis cluster
- [ ] Restore old Redis or data
- [ ] Revert backend environment variables
- [ ] Restart backend services
- [ ] Verify application health
- [ ] Check logs for errors
- [ ] Monitor for 30 minutes
- [ ] Document issues encountered

---

## 📞 Support & Troubleshooting

### Common Issues

#### Issue: Connection Refused

```bash
# Check Redis is running
docker ps | grep redis

# Check logs
docker logs bhriguwelt-redis-master

# Verify password
echo $REDIS_PASSWORD

# Test connection
docker exec bhriguwelt-redis-master redis-cli -a "$REDIS_PASSWORD" ping
```

#### Issue: High Memory Usage

```bash
# Check memory
docker exec bhriguwelt-redis-master redis-cli -a "$REDIS_PASSWORD" INFO memory

# Clear cache if needed (CAUTION!)
docker exec bhriguwelt-redis-master redis-cli -a "$REDIS_PASSWORD" FLUSHDB

# Increase maxmemory
# Edit redis.conf: maxmemory 2gb
```

#### Issue: Slow Performance

```bash
# Check slow log
docker exec bhriguwelt-redis-master redis-cli -a "$REDIS_PASSWORD" SLOWLOG GET 10

# Monitor operations
docker exec bhriguwelt-redis-master redis-cli -a "$REDIS_PASSWORD" --stat

# Check network latency
docker exec bhriguwelt-redis-master redis-cli -a "$REDIS_PASSWORD" --latency
```

### Getting Help

1. **Check logs**: `docker-compose logs`
2. **Review monitoring**: `curl http://localhost:8000/api/redis/health`
3. **Consult README**: See troubleshooting section
4. **GitHub Issues**: Open issue with logs and config

---

## 📋 Deployment Checklist Summary

### Pre-Deployment
- [ ] Backup existing data
- [ ] Review architecture
- [ ] Generate secure passwords
- [ ] Prepare environment config

### Deployment
- [ ] Deploy Redis cluster
- [ ] Verify cluster health
- [ ] Update backend config
- [ ] Deploy backend
- [ ] Test integration

### Post-Deployment
- [ ] Run verification script
- [ ] Load testing
- [ ] Failover testing
- [ ] Configure monitoring
- [ ] Set up alerts

### Operations
- [ ] Daily health checks
- [ ] Automated backups
- [ ] Monitor metrics
- [ ] Review logs

---

**Deployment Guide Version**: 1.0.0
**Last Updated**: 2026-01-16
**Next Review**: 2026-04-16
