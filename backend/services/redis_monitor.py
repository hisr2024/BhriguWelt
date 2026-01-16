"""
Comprehensive Redis Monitoring and Alerting System
Features: Health checks, performance metrics, alerting, dashboard data
"""

import os
import time
import json
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from utils.logger import setup_logger

logger = setup_logger(__name__)

# Try to import redis client
try:
    from services.enterprise_redis_client import enterprise_redis_client as redis_client
    REDIS_AVAILABLE = redis_client is not None
except ImportError:
    REDIS_AVAILABLE = False
    redis_client = None
    logger.warning("⚠️ Enterprise Redis client not available - monitoring disabled")


@dataclass
class Alert:
    """Alert data structure"""
    id: str
    type: str
    severity: str  # 'info', 'warning', 'critical'
    message: str
    timestamp: str
    metrics: Dict[str, Any]
    resolved: bool = False
    resolved_at: Optional[str] = None
    recommended_action: Optional[str] = None


class RedisMonitor:
    """Comprehensive Redis monitoring and alerting"""

    def __init__(self):
        self.redis = redis_client
        self.enabled = REDIS_AVAILABLE and os.getenv('ENABLE_REDIS_MONITORING', 'true').lower() == 'true'

        # Alert thresholds
        self.thresholds = {
            'connection_failures': int(os.getenv('REDIS_ALERT_CONNECTION_FAILURES', '5')),
            'memory_usage_percent': int(os.getenv('REDIS_ALERT_MEMORY_PERCENT', '80')),
            'cpu_usage_percent': int(os.getenv('REDIS_ALERT_CPU_PERCENT', '70')),
            'slow_queries_per_minute': int(os.getenv('REDIS_ALERT_SLOW_QUERIES', '10')),
            'response_time_ms': int(os.getenv('REDIS_ALERT_RESPONSE_TIME', '1000')),
            'cache_hit_rate_min': int(os.getenv('REDIS_ALERT_HIT_RATE_MIN', '70'))
        }

        self.alerts: List[Alert] = []
        self.metrics_history: List[Dict[str, Any]] = []
        self.monitoring_started = None

        if not self.enabled:
            logger.warning("⚠️ Redis monitoring disabled")
        else:
            logger.info("✅ Redis monitoring initialized")

    def collect_metrics(self) -> Dict[str, Any]:
        """Collect comprehensive Redis metrics"""
        if not self.enabled or not self.redis:
            return {'error': 'monitoring_disabled'}

        try:
            # Get Redis stats
            redis_stats = self.redis.get_stats()

            # Get health status
            health_status = self.redis.get_health_status()

            # Measure response time
            response_time = self._measure_response_time()

            # Calculate derived metrics
            derived_metrics = {
                'timestamp': datetime.now().isoformat(),
                'memory_usage_percent': self._calculate_memory_usage_percent(redis_stats.get('redis_info', {})),
                'cache_hit_rate': self._calculate_cache_hit_rate(redis_stats),
                'avg_response_time_ms': response_time,
                'operations_per_second': self._calculate_ops_per_second(redis_stats),
                'connection_success_rate': self._calculate_connection_success_rate(redis_stats)
            }

            # Combine all metrics
            metrics = {
                'timestamp': datetime.now().isoformat(),
                'health': health_status,
                'stats': redis_stats,
                'derived': derived_metrics,
                'alerts_active': len([a for a in self.alerts if not a.resolved])
            }

            # Store in history
            self.metrics_history.append(metrics)

            # Keep only last 1000 metrics (about 16 hours if collected every minute)
            if len(self.metrics_history) > 1000:
                self.metrics_history = self.metrics_history[-1000:]

            logger.debug(f"📊 Collected Redis metrics: {len(metrics)} data points")

            return metrics

        except Exception as e:
            logger.error(f"❌ Metrics collection failed: {e}")
            return {'error': str(e), 'timestamp': datetime.now().isoformat()}

    def _measure_response_time(self) -> float:
        """Measure Redis response time in milliseconds"""
        if not self.enabled or not self.redis:
            return 0.0

        try:
            start_time = time.time()
            self.redis.get('_monitor_ping_test')
            elapsed_ms = (time.time() - start_time) * 1000
            return round(elapsed_ms, 2)
        except Exception as e:
            logger.warning(f"Response time measurement failed: {e}")
            return float('inf')

    def _calculate_memory_usage_percent(self, redis_info: Dict[str, Any]) -> float:
        """Calculate memory usage percentage"""
        try:
            # Get used memory from info
            used_memory_str = redis_info.get('used_memory_human', '0B')

            # Parse memory value (e.g., "512.5M" -> 512.5)
            used_memory_mb = 0
            if 'M' in used_memory_str:
                used_memory_mb = float(used_memory_str.replace('M', ''))
            elif 'K' in used_memory_str:
                used_memory_mb = float(used_memory_str.replace('K', '')) / 1024
            elif 'G' in used_memory_str:
                used_memory_mb = float(used_memory_str.replace('G', '')) * 1024

            # Default max memory (can be configured)
            max_memory_mb = int(os.getenv('REDIS_MAX_MEMORY_MB', '512'))

            if max_memory_mb > 0:
                return round((used_memory_mb / max_memory_mb) * 100, 2)

            return 0.0

        except Exception as e:
            logger.warning(f"Memory usage calculation failed: {e}")
            return 0.0

    def _calculate_cache_hit_rate(self, stats: Dict[str, Any]) -> float:
        """Calculate cache hit rate from stats"""
        try:
            # Try server-side stats first
            redis_info = stats.get('redis_info', {})
            if 'server_cache_hit_rate' in redis_info:
                return redis_info['server_cache_hit_rate']

            # Fall back to client-side stats
            operations = stats.get('operations', {})
            hits = operations.get('hits', 0)
            total = operations.get('get', 0)

            if total > 0:
                return round((hits / total) * 100, 2)

            return 0.0

        except Exception as e:
            logger.warning(f"Cache hit rate calculation failed: {e}")
            return 0.0

    def _calculate_ops_per_second(self, stats: Dict[str, Any]) -> float:
        """Calculate operations per second"""
        try:
            operations = stats.get('operations', {})
            total_ops = sum([
                operations.get('get', 0),
                operations.get('set', 0),
                operations.get('delete', 0),
                operations.get('incr', 0)
            ])

            # Calculate based on uptime if available
            redis_info = stats.get('redis_info', {})
            uptime_seconds = redis_info.get('uptime_in_seconds', 1)

            if uptime_seconds > 0:
                return round(total_ops / uptime_seconds, 2)

            return 0.0

        except Exception as e:
            logger.warning(f"OPS calculation failed: {e}")
            return 0.0

    def _calculate_connection_success_rate(self, stats: Dict[str, Any]) -> float:
        """Calculate connection success rate"""
        try:
            connection = stats.get('connection', {})
            successful = connection.get('successful_connections', 0)
            total = connection.get('total_attempts', 0)

            if total > 0:
                return round((successful / total) * 100, 2)

            return 100.0  # Default to 100% if no data

        except Exception as e:
            logger.warning(f"Connection success rate calculation failed: {e}")
            return 100.0

    def check_alerts(self) -> List[Alert]:
        """Check for alert conditions and return any new alerts"""
        if not self.enabled or not self.metrics_history:
            return []

        latest_metrics = self.metrics_history[-1]
        new_alerts = []

        try:
            # Check connection alerts
            alert = self._check_connection_alerts(latest_metrics)
            if alert:
                new_alerts.append(alert)

            # Check memory alerts
            alert = self._check_memory_alerts(latest_metrics)
            if alert:
                new_alerts.append(alert)

            # Check performance alerts
            alert = self._check_performance_alerts(latest_metrics)
            if alert:
                new_alerts.append(alert)

            # Check cache hit rate alerts
            alert = self._check_cache_hit_rate_alerts(latest_metrics)
            if alert:
                new_alerts.append(alert)

            # Add new alerts to the list
            for alert in new_alerts:
                self._trigger_alert(alert)

        except Exception as e:
            logger.error(f"❌ Alert checking failed: {e}")

        return new_alerts

    def _check_connection_alerts(self, metrics: Dict[str, Any]) -> Optional[Alert]:
        """Check for connection-related alerts"""
        try:
            health = metrics.get('health', {})
            circuit_breaker = health.get('circuit_breaker', {})
            failures = circuit_breaker.get('failure_count', 0)

            if failures >= self.thresholds['connection_failures']:
                return Alert(
                    id=f"connection_failures_{int(time.time())}",
                    type='connection_failures',
                    severity='critical',
                    message=f'Redis connection failures: {failures} (threshold: {self.thresholds["connection_failures"]})',
                    timestamp=datetime.now().isoformat(),
                    metrics={'failures': failures, 'health': health},
                    recommended_action='Check Redis connectivity, restart Redis service, verify network configuration'
                )

            return None

        except Exception as e:
            logger.warning(f"Connection alert check failed: {e}")
            return None

    def _check_memory_alerts(self, metrics: Dict[str, Any]) -> Optional[Alert]:
        """Check for memory-related alerts"""
        try:
            derived = metrics.get('derived', {})
            memory_percent = derived.get('memory_usage_percent', 0)

            if memory_percent >= self.thresholds['memory_usage_percent']:
                return Alert(
                    id=f"high_memory_usage_{int(time.time())}",
                    type='high_memory_usage',
                    severity='warning',
                    message=f'Redis memory usage: {memory_percent}% (threshold: {self.thresholds["memory_usage_percent"]}%)',
                    timestamp=datetime.now().isoformat(),
                    metrics={'memory_percent': memory_percent},
                    recommended_action='Monitor memory usage, consider increasing Redis memory limit, check for memory leaks, review eviction policy'
                )

            return None

        except Exception as e:
            logger.warning(f"Memory alert check failed: {e}")
            return None

    def _check_performance_alerts(self, metrics: Dict[str, Any]) -> Optional[Alert]:
        """Check for performance-related alerts"""
        try:
            derived = metrics.get('derived', {})
            response_time = derived.get('avg_response_time_ms', 0)

            if response_time > self.thresholds['response_time_ms']:
                return Alert(
                    id=f"slow_response_time_{int(time.time())}",
                    type='slow_response_time',
                    severity='warning',
                    message=f'Redis response time: {response_time}ms (threshold: {self.thresholds["response_time_ms"]}ms)',
                    timestamp=datetime.now().isoformat(),
                    metrics={'response_time_ms': response_time},
                    recommended_action='Check Redis performance, monitor slow queries, review Redis configuration, check network latency'
                )

            return None

        except Exception as e:
            logger.warning(f"Performance alert check failed: {e}")
            return None

    def _check_cache_hit_rate_alerts(self, metrics: Dict[str, Any]) -> Optional[Alert]:
        """Check for cache hit rate alerts"""
        try:
            derived = metrics.get('derived', {})
            cache_hit_rate = derived.get('cache_hit_rate', 100)

            if cache_hit_rate < self.thresholds['cache_hit_rate_min']:
                return Alert(
                    id=f"low_cache_hit_rate_{int(time.time())}",
                    type='low_cache_hit_rate',
                    severity='info',
                    message=f'Cache hit rate: {cache_hit_rate}% (minimum: {self.thresholds["cache_hit_rate_min"]}%)',
                    timestamp=datetime.now().isoformat(),
                    metrics={'cache_hit_rate': cache_hit_rate},
                    recommended_action='Review caching strategy, check TTL settings, consider preloading frequently accessed data'
                )

            return None

        except Exception as e:
            logger.warning(f"Cache hit rate alert check failed: {e}")
            return None

    def _trigger_alert(self, alert: Alert):
        """Trigger alert with logging and storage"""
        try:
            # Add to active alerts
            self.alerts.append(alert)

            # Log alert
            log_level = {
                'info': logging.INFO,
                'warning': logging.WARNING,
                'critical': logging.CRITICAL
            }.get(alert.severity, logging.WARNING)

            logger.log(log_level, f"🚨 REDIS ALERT [{alert.severity.upper()}]: {alert.message}")

            # Store alert in Redis if available
            if self.enabled and self.redis:
                try:
                    alert_key = f"alert:{alert.id}"
                    self.redis.set(alert_key, json.dumps(asdict(alert)), ex=86400)  # 24 hours
                except Exception as e:
                    logger.warning(f"Failed to store alert in Redis: {e}")

            # Send notifications (placeholder for future implementation)
            self._send_notifications(alert)

        except Exception as e:
            logger.error(f"Alert triggering failed: {e}")

    def _send_notifications(self, alert: Alert):
        """Send alert notifications (placeholder for integration with external systems)"""
        # This would integrate with email, Slack, PagerDuty, etc.
        logger.info(f"📤 Alert notification would be sent: {alert.message}")

    def resolve_alert(self, alert_id: str) -> bool:
        """Resolve an active alert"""
        try:
            # Find and resolve alert
            for alert in self.alerts:
                if alert.id == alert_id and not alert.resolved:
                    alert.resolved = True
                    alert.resolved_at = datetime.now().isoformat()

                    # Update in Redis
                    if self.enabled and self.redis:
                        try:
                            alert_key = f"alert:{alert_id}"
                            self.redis.set(alert_key, json.dumps(asdict(alert)), ex=86400)
                        except Exception as e:
                            logger.warning(f"Failed to update alert in Redis: {e}")

                    logger.info(f"✅ Alert resolved: {alert_id}")
                    return True

            logger.warning(f"Alert not found or already resolved: {alert_id}")
            return False

        except Exception as e:
            logger.error(f"❌ Alert resolution failed: {e}")
            return False

    def get_dashboard_data(self) -> Dict[str, Any]:
        """Get monitoring dashboard data"""
        try:
            # Get current metrics
            current_metrics = self.metrics_history[-1] if self.metrics_history else {}

            # Get active alerts
            active_alerts = [asdict(a) for a in self.alerts if not a.resolved]

            # Get recent metrics (last 100 data points)
            recent_metrics = self.metrics_history[-100:] if len(self.metrics_history) > 100 else self.metrics_history

            # Calculate uptime
            uptime_info = self._calculate_uptime()

            # Get health status
            health_status = self.redis.get_health_status() if self.redis else {'status': 'unavailable'}

            return {
                'current_metrics': current_metrics,
                'active_alerts': active_alerts,
                'total_alerts': len(self.alerts),
                'resolved_alerts': len([a for a in self.alerts if a.resolved]),
                'recent_metrics': recent_metrics,
                'health_status': health_status,
                'uptime': uptime_info,
                'thresholds': self.thresholds,
                'monitoring_enabled': self.enabled,
                'last_updated': datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"❌ Dashboard data retrieval failed: {e}")
            return {'error': str(e), 'last_updated': datetime.now().isoformat()}

    def _calculate_uptime(self) -> Dict[str, Any]:
        """Calculate monitoring uptime"""
        if not self.monitoring_started:
            self.monitoring_started = time.time()

        uptime_seconds = int(time.time() - self.monitoring_started)
        uptime_hours = uptime_seconds // 3600
        uptime_days = uptime_hours // 24

        return {
            'uptime_seconds': uptime_seconds,
            'uptime_hours': uptime_hours,
            'uptime_days': uptime_days,
            'started_at': datetime.fromtimestamp(self.monitoring_started).isoformat()
        }

    def get_health_summary(self) -> Dict[str, Any]:
        """Get concise health summary for quick checks"""
        try:
            if not self.enabled or not self.metrics_history:
                return {
                    'status': 'unavailable',
                    'message': 'Monitoring disabled or no data available'
                }

            latest = self.metrics_history[-1]
            health = latest.get('health', {})
            derived = latest.get('derived', {})

            # Determine overall status
            active_critical_alerts = len([a for a in self.alerts if not a.resolved and a.severity == 'critical'])
            active_warning_alerts = len([a for a in self.alerts if not a.resolved and a.severity == 'warning'])

            if active_critical_alerts > 0:
                overall_status = 'critical'
            elif active_warning_alerts > 0:
                overall_status = 'degraded'
            elif health.get('connected', False):
                overall_status = 'healthy'
            else:
                overall_status = 'unhealthy'

            return {
                'status': overall_status,
                'connected': health.get('connected', False),
                'circuit_breaker_state': health.get('circuit_breaker', {}).get('state', 'unknown'),
                'memory_usage_percent': derived.get('memory_usage_percent', 0),
                'cache_hit_rate': derived.get('cache_hit_rate', 0),
                'response_time_ms': derived.get('avg_response_time_ms', 0),
                'active_alerts': {
                    'critical': active_critical_alerts,
                    'warning': active_warning_alerts,
                    'info': len([a for a in self.alerts if not a.resolved and a.severity == 'info'])
                },
                'last_check': latest.get('timestamp', datetime.now().isoformat())
            }

        except Exception as e:
            logger.error(f"Health summary failed: {e}")
            return {
                'status': 'error',
                'error': str(e)
            }

    def reset_monitoring_data(self):
        """Reset monitoring data (for testing or maintenance)"""
        self.metrics_history = []
        self.alerts = []
        self.monitoring_started = time.time()
        logger.info("🔄 Monitoring data reset")


# Global instance
redis_monitor = RedisMonitor()


# Convenience functions
def get_health_summary() -> Dict[str, Any]:
    """Get Redis health summary"""
    return redis_monitor.get_health_summary()


def get_dashboard_data() -> Dict[str, Any]:
    """Get full dashboard data"""
    return redis_monitor.get_dashboard_data()


def collect_metrics() -> Dict[str, Any]:
    """Collect current metrics"""
    return redis_monitor.collect_metrics()


def check_alerts() -> List[Dict[str, Any]]:
    """Check for new alerts"""
    alerts = redis_monitor.check_alerts()
    return [asdict(a) for a in alerts]
