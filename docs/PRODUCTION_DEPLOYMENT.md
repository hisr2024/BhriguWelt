# BhriguWelt Production Deployment Guide

## Overview

This guide covers deploying BhriguWelt to production with enterprise-grade infrastructure, monitoring, and security.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Docker Deployment](#docker-deployment)
4. [Monitoring Setup](#monitoring-setup)
5. [Security Hardening](#security-hardening)
6. [Performance Optimization](#performance-optimization)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements

- **OS:** Ubuntu 22.04 LTS or similar
- **CPU:** 4+ cores (8+ recommended)
- **RAM:** 8GB minimum (16GB+ recommended)
- **Storage:** 50GB+ SSD
- **Network:** Static IP, ports 80/443 open

### Software Requirements

```bash
# Docker & Docker Compose
sudo apt update
sudo apt install -y docker.io docker-compose-plugin
sudo systemctl enable docker
sudo systemctl start docker

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Verify installation
docker --version
docker compose version
```

---

## Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/BhriguWelt.git
cd BhriguWelt
git checkout main
```

### 2. Create Environment Files

#### Production Environment (`.env.production`)

```bash
# Application
FLASK_ENV=production
NODE_ENV=production
SECRET_KEY=YOUR_VERY_SECURE_SECRET_KEY_HERE_MIN_32_CHARS

# Database
DATABASE_URL=postgresql://bhriguwelt_user:SECURE_PASSWORD@postgres:5432/bhriguwelt
POSTGRES_DB=bhriguwelt
POSTGRES_USER=bhriguwelt_user
POSTGRES_PASSWORD=VERY_SECURE_DATABASE_PASSWORD

# Redis
REDIS_URL=redis://redis:6379/0
CELERY_BROKER_URL=redis://redis:6379/1
CELERY_RESULT_BACKEND=redis://redis:6379/2

# API Keys
OPENAI_API_KEY=sk-your-openai-api-key-here
ANTHROPIC_API_KEY=your-anthropic-api-key-here

# Frontend
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_WS_URL=wss://api.yourdomain.com

# Monitoring
GRAFANA_PASSWORD=secure_grafana_admin_password

# Security
ENABLE_CSRF_PROTECTION=true
ENABLE_RATE_LIMITING=true
ENABLE_CACHING=true
```

**CRITICAL:** Generate secure secrets:

```bash
# Generate SECRET_KEY (Python)
python3 -c 'import secrets; print(secrets.token_hex(32))'

# Generate passwords
openssl rand -base64 32
```

### 3. Configure SSL Certificates

```bash
# Create SSL directory
mkdir -p infrastructure/nginx/ssl

# Option A: Let's Encrypt (Recommended)
sudo apt install certbot
sudo certbot certonly --standalone -d yourdomain.com -d api.yourdomain.com

# Copy certificates
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem infrastructure/nginx/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem infrastructure/nginx/ssl/

# Option B: Self-signed (Development only)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout infrastructure/nginx/ssl/privkey.pem \
  -out infrastructure/nginx/ssl/fullchain.pem
```

---

## Docker Deployment

### 1. Build Images

```bash
# Build all services
docker compose -f docker-compose.production.yml build --no-cache

# Verify images
docker images | grep bhriguwelt
```

### 2. Initialize Database

```bash
# Start PostgreSQL
docker compose -f docker-compose.production.yml up -d postgres

# Wait for it to be ready
docker compose -f docker-compose.production.yml exec postgres pg_isready

# Run migrations
docker compose -f docker-compose.production.yml run --rm backend flask db upgrade
```

### 3. Start All Services

```bash
# Start all services
docker compose -f docker-compose.production.yml up -d

# Verify all containers are running
docker compose -f docker-compose.production.yml ps

# Check logs
docker compose -f docker-compose.production.yml logs -f
```

### 4. Health Checks

```bash
# Backend health
curl http://localhost:5000/health

# Frontend health
curl http://localhost:3000/api/health

# Redis health
docker compose -f docker-compose.production.yml exec redis redis-cli ping

# PostgreSQL health
docker compose -f docker-compose.production.yml exec postgres pg_isready
```

---

## Monitoring Setup

### 1. Access Grafana

```bash
# Default URL: http://localhost:3001
# Username: admin
# Password: (from GRAFANA_PASSWORD in .env)
```

### 2. Import Dashboards

1. Navigate to **Dashboards → Import**
2. Upload dashboards from `monitoring/grafana/dashboards/`
3. Select Prometheus datasource

### 3. Configure Alerts

Edit `monitoring/prometheus/alerts/rules.yml`:

```yaml
groups:
  - name: bhriguwelt_alerts
    interval: 30s
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }}% over the last 5 minutes"

      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High response time"
          description: "95th percentile response time is {{ $value }}s"

      - alert: DatabaseDown
        expr: up{job="postgres"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Database is down"
```

### 4. Set Up Alerting

Configure AlertManager for notifications:

```yaml
# monitoring/alertmanager/alertmanager.yml
global:
  smtp_smarthost: 'smtp.gmail.com:587'
  smtp_from: 'alerts@bhriguwelt.com'
  smtp_auth_username: 'your-email@gmail.com'
  smtp_auth_password: 'your-app-password'

route:
  receiver: 'email-alerts'
  group_by: ['alertname', 'severity']
  group_wait: 10s
  group_interval: 10m
  repeat_interval: 12h

receivers:
  - name: 'email-alerts'
    email_configs:
      - to: 'ops-team@yourdomain.com'
        headers:
          Subject: '[BhriguWelt] {{ .GroupLabels.alertname }}'
```

---

## Security Hardening

### 1. Firewall Configuration

```bash
# Enable UFW
sudo ufw enable

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Deny all other incoming
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Check status
sudo ufw status
```

### 2. Fail2Ban Setup

```bash
# Install Fail2Ban
sudo apt install fail2ban

# Configure for Nginx
sudo cat > /etc/fail2ban/jail.d/nginx.conf << EOF
[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log

[nginx-noscript]
enabled = true
port = http,https
logpath = /var/log/nginx/access.log
maxretry = 6
EOF

# Restart Fail2Ban
sudo systemctl restart fail2ban
```

### 3. Docker Security

```bash
# Run containers with read-only root filesystem
# Add to docker-compose.production.yml:
services:
  backend:
    read_only: true
    tmpfs:
      - /tmp
      - /var/run

# Limit container capabilities
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE
```

### 4. Regular Updates

```bash
# Create update script
cat > update.sh << 'EOF'
#!/bin/bash
set -e

echo "Backing up database..."
docker compose -f docker-compose.production.yml exec postgres \
  pg_dump -U bhriguwelt_user bhriguwelt > backup_$(date +%Y%m%d).sql

echo "Pulling latest code..."
git pull origin main

echo "Rebuilding containers..."
docker compose -f docker-compose.production.yml build

echo "Restarting services..."
docker compose -f docker-compose.production.yml up -d

echo "Running migrations..."
docker compose -f docker-compose.production.yml exec backend flask db upgrade

echo "Deployment complete!"
EOF

chmod +x update.sh
```

---

## Performance Optimization

### 1. Enable HTTP/2

Update `infrastructure/nginx/nginx.conf`:

```nginx
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;

    # ... rest of config
}
```

### 2. Redis Optimization

```bash
# Edit docker-compose.production.yml
services:
  redis:
    command: >
      redis-server
      --appendonly yes
      --maxmemory 1gb
      --maxmemory-policy allkeys-lru
      --save 60 1000
      --tcp-keepalive 60
      --timeout 300
      --maxclients 10000
```

### 3. PostgreSQL Tuning

```sql
-- Connect to PostgreSQL
docker compose -f docker-compose.production.yml exec postgres psql -U bhriguwelt_user

-- Optimize settings
ALTER SYSTEM SET shared_buffers = '2GB';
ALTER SYSTEM SET effective_cache_size = '6GB';
ALTER SYSTEM SET maintenance_work_mem = '512MB';
ALTER SYSTEM SET work_mem = '16MB';
ALTER SYSTEM SET max_connections = 200;

-- Reload config
SELECT pg_reload_conf();
```

### 4. Enable Caching

```bash
# Redis caching is already configured
# Verify cache hit rate in Grafana dashboard

# Monitor cache performance
docker compose -f docker-compose.production.yml exec redis redis-cli INFO STATS
```

---

## Troubleshooting

### Common Issues

#### 1. Container Won't Start

```bash
# Check logs
docker compose -f docker-compose.production.yml logs <service-name>

# Inspect container
docker inspect <container-id>

# Check resource usage
docker stats
```

#### 2. Database Connection Issues

```bash
# Test connection
docker compose -f docker-compose.production.yml exec backend \
  python -c "from models import db; print(db.session.execute('SELECT 1').scalar())"

# Check PostgreSQL logs
docker compose -f docker-compose.production.yml logs postgres
```

#### 3. High Memory Usage

```bash
# Check memory by container
docker stats --no-stream

# Limit container memory
# Add to docker-compose.production.yml:
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 2G
```

#### 4. SSL Certificate Issues

```bash
# Verify certificate
openssl x509 -in infrastructure/nginx/ssl/fullchain.pem -text -noout

# Test SSL
curl -vI https://yourdomain.com

# Renew Let's Encrypt
sudo certbot renew
```

### Performance Issues

```bash
# Check response times
docker compose -f docker-compose.production.yml exec backend \
  python -c "from services.bhrigu_predictions import get_bhrigu_service; import time; start = time.time(); s = get_bhrigu_service(); print(f'Init time: {time.time()-start}s')"

# Monitor API latency
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:5000/health

# Check Redis latency
docker compose -f docker-compose.production.yml exec redis redis-cli --latency
```

---

## Backup & Recovery

### Automated Backups

```bash
# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR=/var/backups/bhriguwelt
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Database backup
docker compose -f docker-compose.production.yml exec -T postgres \
  pg_dump -U bhriguwelt_user bhriguwelt | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Redis backup
docker compose -f docker-compose.production.yml exec redis redis-cli SAVE
docker cp $(docker compose -f docker-compose.production.yml ps -q redis):/data/dump.rdb $BACKUP_DIR/redis_$DATE.rdb

# Cleanup old backups (keep 30 days)
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete
find $BACKUP_DIR -name "*.rdb" -mtime +30 -delete

echo "Backup completed: $DATE"
EOF

chmod +x backup.sh

# Add to crontab
crontab -e
# Add: 0 2 * * * /path/to/backup.sh
```

---

## Maintenance

### Regular Tasks

1. **Weekly:**
   - Review error logs
   - Check monitoring dashboards
   - Review security alerts

2. **Monthly:**
   - Update dependencies
   - Review performance metrics
   - Database optimization
   - Certificate renewal check

3. **Quarterly:**
   - Security audit
   - Load testing
   - Disaster recovery drill
   - Documentation update

---

## Support

For production support:
- **Email:** ops@bhriguwelt.com
- **Docs:** https://docs.bhriguwelt.com
- **Status:** https://status.bhriguwelt.com

---

© 2026 BhriguWelt. All rights reserved.
