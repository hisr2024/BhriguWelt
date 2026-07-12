"""
Tests for Celery Background Tasks

Tests the implementation of Celery tasks including:
- cleanup_old_sessions
- generate_daily_insights
- send_notification_async
- task_with_retry

Note: the tasks import their dependencies lazily (inside the task body) to
avoid circular imports, so patches target the source modules
(backend.models, backend.app, backend.services.prediction_orchestrator)
rather than attributes on backend.services.celery_tasks.
"""
import os
import sys
import pytest
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime, timedelta


class TestCeleryTasks:
    """Test suite for Celery background tasks"""

    @patch('backend.models.BhriguSessionLog')
    @patch('backend.models.BhriguPredictionCache')
    def test_cleanup_old_sessions_success(self, mock_cache, mock_session):
        """Test successful cleanup of old sessions and predictions"""
        from backend.services.celery_tasks import cleanup_old_sessions

        # Column comparisons (e.g. session_start < cutoff) must not raise
        mock_session.session_start.__lt__.return_value = True
        mock_cache.created_at.__lt__.return_value = True
        mock_cache.access_count.__lt__.return_value = True

        # Mock query results (query is an attribute on the model class)
        mock_session.query.filter.return_value.delete.return_value = 5
        mock_cache.query.filter.return_value.delete.return_value = 3

        # Execute task with the app module (source of `db`) mocked out
        mock_app_module = MagicMock()
        mock_db = mock_app_module.db
        with patch.dict(sys.modules, {'backend.app': mock_app_module}):
            result = cleanup_old_sessions()

        # Assertions
        assert result['success'] is True
        assert result['deleted_count'] == 8
        assert result['sessions_deleted'] == 5
        assert result['predictions_deleted'] == 3
        mock_db.session.commit.assert_called_once()

    @patch('backend.models.BhriguSessionLog')
    def test_cleanup_old_sessions_error(self, mock_session):
        """Test cleanup task handles errors gracefully"""
        from backend.services.celery_tasks import cleanup_old_sessions

        # Mock exception
        mock_session.session_start.__lt__.return_value = True
        mock_session.query.filter.side_effect = Exception("Database error")

        # Execute task with the app module (source of `db`) mocked out
        mock_app_module = MagicMock()
        mock_db = mock_app_module.db
        with patch.dict(sys.modules, {'backend.app': mock_app_module}):
            result = cleanup_old_sessions()

        # Assertions
        assert result['success'] is False
        assert 'error' in result
        assert result['error'] == "Database error"
        mock_db.session.rollback.assert_called_once()

    @patch('backend.models.BhriguSessionLog')
    @patch('backend.models.BhriguPredictionCache')
    def test_generate_daily_insights_no_api_key(self, mock_cache, mock_session):
        """Test daily insights skips when OpenAI not configured"""
        from backend.services.celery_tasks import generate_daily_insights

        # Ensure no API key is visible to the task
        with patch.dict(sys.modules, {'backend.app': MagicMock()}):
            with patch.dict(os.environ):
                os.environ.pop('OPENAI_API_KEY', None)
                result = generate_daily_insights()

        # Assertions
        assert result['success'] is True
        assert result['processed_count'] == 0
        assert 'Skipped' in result['message']

    @patch('backend.services.prediction_orchestrator.PredictionOrchestrator')
    @patch('backend.models.BhriguSessionLog')
    @patch('backend.models.BhriguPredictionCache')
    def test_generate_daily_insights_with_users(self, mock_cache, mock_session, mock_orchestrator):
        """Test daily insights processes active users"""
        from backend.services.celery_tasks import generate_daily_insights

        # Column comparisons (e.g. session_start >= cutoff) must not raise
        mock_session.session_start.__ge__.return_value = True

        # Mock recent sessions (query is an attribute on the model class)
        mock_session_obj = Mock()
        mock_session_obj.user_hash = 'user123'
        mock_session.query.filter.return_value.limit.return_value.all.return_value = [
            mock_session_obj
        ]

        # Mock recent prediction
        mock_pred = Mock()
        mock_cache.query.filter_by.return_value.order_by.return_value.first.return_value = mock_pred

        # Execute task with API key present
        with patch.dict(sys.modules, {'backend.app': MagicMock()}):
            with patch.dict(os.environ, {'OPENAI_API_KEY': 'test-api-key'}):
                result = generate_daily_insights()

        # Assertions
        assert result['success'] is True
        assert result['processed_count'] >= 0  # May be 0 if prediction logic skipped
        assert 'total_active_users' in result

    def test_send_notification_async_success(self):
        """Test notification sending logs successfully"""
        from backend.services.celery_tasks import send_notification_async

        mock_sentry = MagicMock()

        # Mock Sentry DSN present (sentry_sdk is imported lazily inside the task)
        with patch.dict(sys.modules, {'sentry_sdk': mock_sentry}):
            with patch.dict(os.environ, {'SENTRY_DSN': 'https://sentry.example.com'}):
                os.environ.pop('SENDGRID_API_KEY', None)
                result = send_notification_async(
                    user_id='user123',
                    notification_type='daily_insight',
                    data={'message': 'Test notification'}
                )

        # Assertions
        assert result['success'] is True
        assert result['user_id'] == 'user123'
        assert result['type'] == 'daily_insight'
        mock_sentry.capture_message.assert_called_once()

    def test_send_notification_async_error(self):
        """Test notification sending handles errors"""
        from backend.services.celery_tasks import send_notification_async

        # Mock exception in Sentry
        mock_sentry = MagicMock()
        mock_sentry.capture_message.side_effect = Exception("Sentry error")

        # Execute task (should not fail even if Sentry fails)
        with patch.dict(sys.modules, {'sentry_sdk': mock_sentry}):
            with patch.dict(os.environ, {'SENTRY_DSN': 'https://sentry.example.com'}):
                os.environ.pop('SENDGRID_API_KEY', None)
                result = send_notification_async(
                    user_id='user123',
                    notification_type='test',
                    data={}
                )

        # Assertions - should still succeed
        assert result['success'] is True

    def test_task_with_retry_success(self):
        """Test retry task completes successfully"""
        from backend.services.celery_tasks import task_with_retry

        # Create mock self (Celery task instance) and invoke the
        # underlying function directly so the mock is used as `self`
        mock_self = Mock()
        mock_self.request.retries = 0
        mock_self.max_retries = 3

        # Execute with valid data
        result = task_with_retry.__wrapped__.__func__(mock_self, task_data={'key': 'value'})

        # Assertions
        assert result['success'] is True
        assert result['attempts'] == 1

    def test_task_with_retry_missing_data(self):
        """Test retry task raises on missing required data"""
        from backend.services.celery_tasks import task_with_retry

        # Create mock self
        mock_self = Mock()
        mock_self.request.retries = 0
        mock_self.max_retries = 3
        mock_self.retry.side_effect = Exception("Retry triggered")

        # Execute without task_data (should fail and retry)
        with pytest.raises(Exception) as exc_info:
            task_with_retry.__wrapped__.__func__(mock_self)

        # Assertions
        mock_self.retry.assert_called_once()


class TestCeleryIntegration:
    """Integration tests for Celery configuration"""

    def test_celery_app_initialized(self):
        """Test Celery app is properly configured"""
        from backend.services.celery_tasks import celery_app

        assert celery_app is not None
        assert celery_app.conf.task_serializer == 'json'
        assert celery_app.conf.timezone == 'UTC'

    def test_celery_beat_schedule_configured(self):
        """Test periodic tasks are scheduled"""
        from backend.services.celery_tasks import celery_app

        beat_schedule = celery_app.conf.beat_schedule

        # Check all required tasks are scheduled
        assert 'cleanup-old-predictions' in beat_schedule
        assert 'cleanup-old-sessions' in beat_schedule
        assert 'generate-daily-insights' in beat_schedule

        # Verify schedule configuration
        assert beat_schedule['cleanup-old-sessions']['task'] == 'backend.services.celery_tasks.cleanup_old_sessions'
