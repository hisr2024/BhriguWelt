# BhriguWelt Monitoring Setup

## Overview

This directory contains monitoring and observability configuration for BhriguWelt. The monitoring stack helps track application health, performance, and errors across both frontend and backend services.

## Components

### 1. **Sentry** - Error Tracking

Sentry provides real-time error tracking and monitoring for both frontend and backend.

**Configuration:**
- Set `SENTRY_DSN` environment variable in your `.env` file
- Errors are automatically captured and reported
- Frontend errors include browser context and user actions
- Backend errors include stack traces and request context

**Setup:**
```bash
# Backend
pip install sentry-sdk

# Frontend
npm install @sentry/nextjs
```

**Usage:**
```python
# Backend (in app.py or __init__.py)
import sentry_sdk
from sentry_sdk.integrations.flask import FlaskIntegration

sentry_sdk.init(
    dsn=os.getenv("SENTRY_DSN"),
    integrations=[FlaskIntegration()],
    traces_sample_rate=1.0,
    environment=os.getenv("FLASK_ENV", "production")
)
```

```typescript
// Frontend (in sentry.client.config.ts or _app.tsx)
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

### 2. **Health Checks** - Endpoint Monitoring

The `/health` endpoint provides basic health status.

**Endpoint:**
```
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-06T12:00:00Z",
  "services": {
    "database": "up",
    "redis": "up",
    "ai_service": "up"
  }
}
```

**Monitoring Setup:**
- Configure uptime monitoring service (e.g., UptimeRobot, Pingdom)
- Set check interval to 5 minutes
- Alert on 3 consecutive failures
- Monitor from multiple geographic locations

### 3. **Logging** - Structured Logging with Telemetry

BhriguWelt uses structured logging for better observability.

**Log Levels:**
- `DEBUG`: Detailed information for diagnosing problems
- `INFO`: General informational messages
- `WARNING`: Warning messages for potentially harmful situations
- `ERROR`: Error messages for serious problems
- `CRITICAL`: Critical messages for very serious errors

**Configuration:**
```bash
# Set in .env
LOG_LEVEL=INFO  # or DEBUG, WARNING, ERROR, CRITICAL
```

**Log Format:**
```json
{
  "timestamp": "2024-01-06T12:00:00Z",
  "level": "INFO",
  "message": "Request processed successfully",
  "context": {
    "endpoint": "/api/astrology/birth-chart",
    "method": "POST",
    "status_code": 200,
    "duration_ms": 150,
    "user_id": "anonymous"
  }
}
```

### 4. **Prometheus & CloudWatch** - Metrics

Optional metrics collection using Prometheus or AWS CloudWatch.

**Prometheus Setup:**

The `prometheus.yml` configuration file is provided in this directory:

```yaml
# See prometheus.yml in this directory for full configuration
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'bhriguwelt-backend'
    static_configs:
      - targets: ['backend:8000']
```

**CloudWatch Setup:**

The `cloudwatch-exporter.yml` configuration file is provided in this directory for AWS CloudWatch integration.

**Required Environment Variables:**
```bash
# Add to your .env file
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_DEFAULT_REGION=us-east-1  # or your preferred region
AWS_CLOUDWATCH_NAMESPACE=BhriguWelt  # Custom namespace for your metrics
```

**CloudWatch Metrics Configuration:**
- Configure metric filters in AWS CloudWatch console
- Set up log groups for backend and frontend
- Create CloudWatch alarms for critical metrics
- Enable detailed monitoring in your AWS services

**Using CloudWatch with Docker:**
```bash
# Pass AWS credentials to container
docker-compose up -d
# Ensure cloudwatch-exporter service has access to AWS credentials
```

**Key Metrics to Track:**
- Request rate (requests/second)
- Response time (p50, p95, p99)
- Error rate (%)
- Cache hit rate (%)
- AI API usage and latency
- Database query time

### 5. **Docker Compose Monitoring Stack**

A complete monitoring stack is provided in this directory's `docker-compose.yml` file.

**Services included:**
- Prometheus - Metrics collection
- Grafana - Visualization and dashboards (if configured)
- Additional monitoring tools as specified

**Start Monitoring Stack:**
```bash
cd infra/monitoring
docker-compose up -d
```

**Access:**
- Check the docker-compose.yml file for exposed ports and services

## Setup Instructions

### 1. Basic Setup (Sentry + Health Checks)

**Step 1:** Sign up for Sentry (free tier available)
- Go to https://sentry.io/signup/
- Create a new project for BhriguWelt
- Copy the DSN

**Step 2:** Configure environment variables
```bash
# Add to .env
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# For frontend, add to .env.local
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

**Step 3:** Install dependencies
```bash
# Backend
cd backend
pip install sentry-sdk

# Frontend
cd frontend
npm install @sentry/nextjs
```

**Step 4:** Set up health check monitoring
- Choose an uptime monitoring service
- Add the health check URL: https://your-domain.com/health
- Configure alerts for failures

### 2. Advanced Setup (Full Monitoring Stack)

**Step 1:** Start the monitoring stack
```bash
docker-compose -f infra/monitoring/docker-compose.yml up -d
```

**Step 2:** Import Grafana dashboards
- Access Grafana at http://localhost:3001
- Import pre-configured dashboards from `dashboards/` directory

**Step 3:** Configure alerts
- Set up alert rules in Grafana
- Configure notification channels (email, Slack, PagerDuty)

## Best Practices

### 1. **Log Responsibly**
- Never log sensitive information (passwords, API keys, PII)
- Use structured logging for better searchability
- Include context (request ID, user ID, endpoint)

### 2. **Set Up Alerts**
- Alert on error rate threshold (e.g., >1% of requests)
- Alert on high response times (e.g., p95 >3s)
- Alert on service downtime (>3 consecutive health check failures)
- Alert on AI API quota/rate limit warnings

### 3. **Monitor User Experience**
- Track Time to First Byte (TTFB)
- Monitor Core Web Vitals (LCP, FID, CLS)
- Track user-facing errors separately

### 4. **Performance Monitoring**
- Monitor database query performance
- Track cache hit/miss rates
- Monitor AI API latency and usage
- Track memory and CPU usage

### 5. **Security Monitoring**
- Log authentication attempts
- Monitor rate limiting effectiveness
- Track API abuse patterns
- Alert on suspicious activity

## Dashboards

### Backend Dashboard Metrics
- Request rate and response time
- Error rate by endpoint
- AI API usage and latency
- Cache performance
- Database query performance

### Frontend Dashboard Metrics
- Page load times
- Core Web Vitals
- JavaScript errors
- API call latency
- User session duration

## Troubleshooting

### High Error Rate
1. Check Sentry for recent errors
2. Review application logs
3. Check external service status (OpenAI, database)
4. Verify configuration and environment variables

### Slow Response Times
1. Check database query performance
2. Review AI API latency
3. Check cache hit rate
4. Monitor server resources (CPU, memory)

### Service Downtime
1. Check health endpoint
2. Review server logs
3. Verify database connectivity
4. Check external service dependencies

## Resources

- [Sentry Documentation](https://docs.sentry.io/)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [AWS CloudWatch Documentation](https://docs.aws.amazon.com/cloudwatch/)

## Support

For questions or issues with monitoring setup:
1. Check existing documentation
2. Review error logs in Sentry
3. Consult the team on GitHub issues
4. Contact maintainers: @hisr2024
