# BhriguWelt Redis Infrastructure

Enterprise-grade Redis setup with High Availability, monitoring, and comprehensive quota management.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                  BhriguWelt Application                  │
│                                                          │
│  ┌─────────────────┐      ┌─────────────────┐          │
│  │ Enterprise      │      │ AI Quota        │          │
│  │ Redis Client    │◄─────┤ Service         │          │
│  └────────┬────────┘      └─────────────────┘          │
│           │                                              │
│           │  ┌─────────────────┐                        │
│           └─►│ Redis Monitor   │                        │
│              └─────────────────┘                        │
└─────────────────┬────────────────────────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
┌───────▼───────┐   ┌───────▼───────┐
│ Redis Master  │◄──┤ Redis Replica │
│ (Port 6379)   │   │ (Port 6380)   │
└───────┬───────┘   └───────────────┘
        │
        │ Monitored by
        │
┌───────▼────────────────────────────┐
│ Redis Sentinels (3 instances)      │
│ Ports: 26379, 26380, 26381         │
│ - Automatic failover               │
│ - Health monitoring                │
│ - Master election                  │
└────────────────────────────────────┘
```

## 📦 Components

### 1. Redis Cluster
- **Master**: Primary Redis instance (port 6379)
- **Replica**: Backup instance for read operations (port 6380)
- **Sentinels**: 3 instances for automatic failover (ports 26379-26381)
- **Exporter**: Prometheus metrics exporter (port 9121)

### 2. Enterprise Redis Client
- Advanced circuit breaker pattern
- Sentinel support for HA
- Connection pooling
- Comprehensive error handling
- Real-time statistics

### 3. AI Quota Service
- Tiered quota management (Free, Basic, Premium, Enterprise)
- Usage tracking and analytics
- Cost monitoring
- Admin functions

### 4. Monitoring System
- Real-time health checks
- Performance metrics
- Alerting with configurable thresholds
- Dashboard data generation

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- At least 2GB RAM available
- Python 3.11+ (for backend integration)

### 1. Configure Environment

```bash
# Copy example environment file
cp .env.redis.example .env.redis

# Edit the file and set REDIS_PASSWORD
nano .env.redis
```

### 2. Start Redis Cluster

```bash
# Start the entire Redis cluster
docker-compose -f docker-compose.prod.yml up -d

# Check cluster status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### 3. Verify Setup

```bash
# Test Redis master
docker exec -it bhriguwelt-redis-master redis-cli -a YOUR_PASSWORD ping
# Expected output: PONG

# Check Sentinel status
docker exec -it bhriguwelt-redis-sentinel-1 redis-cli -p 26379 sentinel masters
```

### 4. Integrate with Backend

Update your backend `.env` file:

```bash
# Redis Configuration
REDIS_HOST=redis-master
REDIS_PORT=6379
REDIS_PASSWORD=your_secure_password
REDIS_USE_SENTINEL=true
REDIS_SENTINEL_MASTER=bhriguwelt-master
REDIS_SENTINEL_HOSTS=redis-sentinel-1:26379,redis-sentinel-2:26379,redis-sentinel-3:26379
REDIS_MAX_CONNECTIONS=50

# Enable monitoring and quotas
ENABLE_REDIS_MONITORING=true
ENABLE_AI_QUOTA=true
ENABLE_CACHING=true
```

## 📊 Monitoring

### Health Check Endpoint

```python
# In your backend routes
from services.redis_monitor import get_health_summary

@app.route('/api/redis/health')
def redis_health():
    return jsonify(get_health_summary())
```

### Dashboard Data

```python
from services.redis_monitor import get_dashboard_data

@app.route('/api/redis/dashboard')
def redis_dashboard():
    return jsonify(get_dashboard_data())
```

### Metrics Collection

The monitoring system automatically collects metrics every minute:
- Connection status
- Memory usage
- Cache hit rates
- Response times
- Operations per second

### Alerts

Alerts are triggered when thresholds are exceeded:
- **Connection Failures**: > 5 failures
- **Memory Usage**: > 80%
- **Response Time**: > 1000ms
- **Cache Hit Rate**: < 70%

Configure thresholds in `.env.redis`.

## 🔧 Usage Examples

### Basic Redis Operations

```python
from services.enterprise_redis_client import enterprise_redis_client as redis

# Set value
redis.set('key', 'value', ex=3600)  # Expires in 1 hour

# Get value
value = redis.get('key')

# Delete key
redis.delete('key')

# Check if exists
exists = redis.exists('key')

# Increment counter
count = redis.incr('counter')

# Hash operations
redis.hset('user:123', 'name', 'John Doe')
name = redis.hget('user:123', 'name')
user_data = redis.hgetall('user:123')
```

### AI Quota Management

```python
from services.ai_quota_service_enhanced import ai_quota_service_enhanced

# Check user quota
quota_info = await ai_quota_service_enhanced.check_quota('user123')
if quota_info['allowed']:
    # Process request
    # ...

    # Record usage
    await ai_quota_service_enhanced.record_usage(
        user_id='user123',
        request_type='karmic_journey',
        tokens_used=1500,
        cost_usd=0.03
    )

# Get user statistics
stats = await ai_quota_service_enhanced.get_user_stats('user123')

# Upgrade user tier (admin function)
result = await ai_quota_service_enhanced.upgrade_user_tier(
    user_id='user123',
    new_tier='premium',
    admin_user='admin@bhriguwelt.com'
)
```

### Monitoring Integration

```python
from services.redis_monitor import redis_monitor

# Collect current metrics
metrics = redis_monitor.collect_metrics()

# Check for alerts
alerts = redis_monitor.check_alerts()

# Get dashboard data
dashboard = redis_monitor.get_dashboard_data()

# Get health summary
health = redis_monitor.get_health_summary()
```

## 🎯 Quota Tiers

| Tier       | Requests/Day | Tokens/Day | Cost/Day | Features                    |
|------------|--------------|------------|----------|-----------------------------|
| Free       | 10           | 50,000     | $0.10    | Basic predictions           |
| Basic      | 50           | 250,000    | $0.50    | + Past lives, relationships |
| Premium    | 200          | 1,000,000  | $2.00    | + All predictions, support  |
| Enterprise | Unlimited    | Unlimited  | Custom   | + API access, white-label   |

## 🔒 Security Best Practices

1. **Strong Passwords**: Use strong, randomly generated passwords
2. **Network Isolation**: Run Redis on private network
3. **Disable Dangerous Commands**: FLUSHALL, FLUSHDB disabled by default
4. **Enable AUTH**: Always use password authentication
5. **TLS/SSL**: Consider enabling Redis TLS in production
6. **Regular Backups**: Configure automatic RDB/AOF backups
7. **Monitor Access**: Review Redis logs regularly

## 🔍 Troubleshooting

### Redis Master Not Starting

```bash
# Check logs
docker logs bhriguwelt-redis-master

# Common issues:
# 1. Port already in use - change REDIS_PORT
# 2. Permission issues - check volume permissions
# 3. Password not set - ensure REDIS_PASSWORD is configured
```

### Sentinel Not Connecting

```bash
# Check sentinel logs
docker logs bhriguwelt-redis-sentinel-1

# Verify master is reachable
docker exec bhriguwelt-redis-sentinel-1 redis-cli -p 26379 ping

# Check sentinel configuration
docker exec bhriguwelt-redis-sentinel-1 redis-cli -p 26379 sentinel masters
```

### Connection Timeouts

```bash
# Increase timeout values in .env.redis
REDIS_SOCKET_TIMEOUT=10.0
REDIS_CONNECT_TIMEOUT=10.0

# Check network connectivity
docker exec bhriguwelt-redis-master ping redis-replica
```

### High Memory Usage

```bash
# Check memory info
docker exec bhriguwelt-redis-master redis-cli -a PASSWORD info memory

# Reduce maxmemory limit if needed (edit redis.conf)
maxmemory 256mb

# Change eviction policy
maxmemory-policy allkeys-lru
```

### Circuit Breaker Opened

The circuit breaker opens after 5 consecutive failures. It will automatically attempt recovery after 60 seconds. To manually reset:

```python
# Access the Redis client
from services.enterprise_redis_client import enterprise_redis_client

# Force reconnection
enterprise_redis_client._initialize_connection()
```

## 📈 Performance Tuning

### Connection Pool

Adjust based on concurrent requests:

```bash
# For low traffic (< 100 req/sec)
REDIS_MAX_CONNECTIONS=20

# For medium traffic (100-1000 req/sec)
REDIS_MAX_CONNECTIONS=50

# For high traffic (> 1000 req/sec)
REDIS_MAX_CONNECTIONS=100
```

### Memory Optimization

```conf
# redis.conf optimizations
maxmemory-policy allkeys-lru  # Evict least recently used
hash-max-ziplist-entries 512
hash-max-ziplist-value 64
lazyfree-lazy-eviction yes
```

### Persistence Tuning

```conf
# For write-heavy workloads - reduce RDB frequency
save 900 1
save 300 10
save 60 10000

# For durability - use AOF
appendonly yes
appendfsync everysec
```

## 🔄 Failover Testing

Test automatic failover:

```bash
# 1. Check current master
docker exec bhriguwelt-redis-sentinel-1 redis-cli -p 26379 sentinel get-master-addr-by-name bhriguwelt-master

# 2. Simulate master failure
docker stop bhriguwelt-redis-master

# 3. Watch Sentinel promote replica (takes ~5-10 seconds)
docker logs -f bhriguwelt-redis-sentinel-1

# 4. Verify new master
docker exec bhriguwelt-redis-sentinel-1 redis-cli -p 26379 sentinel get-master-addr-by-name bhriguwelt-master

# 5. Restart old master (becomes replica)
docker start bhriguwelt-redis-master
```

## 📊 Metrics & Monitoring

### Prometheus Integration

The Redis exporter exposes metrics on port 9121:

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'redis'
    static_configs:
      - targets: ['localhost:9121']
```

### Key Metrics to Monitor

- `redis_connected_clients`: Number of connected clients
- `redis_used_memory_bytes`: Memory usage
- `redis_keyspace_hits_total`: Cache hits
- `redis_keyspace_misses_total`: Cache misses
- `redis_commands_processed_total`: Total commands

### Grafana Dashboards

Import Grafana dashboard ID: 11835 (Redis Dashboard for Prometheus)

## 🧪 Testing

### Unit Tests

```bash
# Run Redis client tests
pytest backend/services/test_enterprise_redis_client.py -v

# Run quota service tests
pytest backend/services/test_ai_quota_service_enhanced.py -v

# Run monitoring tests
pytest backend/services/test_redis_monitor.py -v
```

### Integration Tests

```bash
# Test full Redis stack
python -m pytest backend/tests/integration/test_redis_integration.py
```

### Load Testing

```bash
# Use redis-benchmark
docker exec bhriguwelt-redis-master redis-benchmark -a PASSWORD -n 100000 -c 50 -q

# Expected results (on modern hardware):
# PING: > 100,000 requests/sec
# GET: > 80,000 requests/sec
# SET: > 80,000 requests/sec
```

## 🌐 Production Deployment

### Docker Swarm

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.prod.yml bhriguwelt-redis
```

### Kubernetes

See `k8s/production/redis-deployment.yaml` for Kubernetes manifests.

### Cloud Providers

- **AWS**: Use ElastiCache for Redis (managed service)
- **Azure**: Use Azure Cache for Redis
- **GCP**: Use Cloud Memorystore for Redis

For managed services, update connection string and disable Sentinel.

## 📚 Additional Resources

- [Redis Official Documentation](https://redis.io/documentation)
- [Redis Sentinel Documentation](https://redis.io/topics/sentinel)
- [Redis Best Practices](https://redis.io/topics/best-practices)
- [Python Redis Client](https://redis-py.readthedocs.io/)

## 🆘 Support

For issues or questions:
1. Check logs: `docker-compose -f docker-compose.prod.yml logs`
2. Review health status: `curl http://localhost:8000/api/redis/health`
3. Check monitoring dashboard: `curl http://localhost:8000/api/redis/dashboard`
4. Open GitHub issue with logs and configuration

## 📝 License

Part of BhriguWelt project. See main repository for license details.

---

**Version**: 1.0.0
**Last Updated**: 2026-01-16
**Maintainer**: BhriguWelt Engineering Team
