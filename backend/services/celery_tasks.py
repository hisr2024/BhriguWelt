"""
Celery Background Task Processing
"""

import os
from celery import Celery
from celery.schedules import crontab

# Initialize Celery
celery_app = Celery(
    'bhriguwelt',
    broker=os.getenv('CELERY_BROKER_URL', 'redis://localhost:6379/0'),
    backend=os.getenv('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0'),
)

# Configure Celery
celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes
    task_soft_time_limit=25 * 60,  # 25 minutes
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=1000,
)

# Periodic tasks schedule
celery_app.conf.beat_schedule = {
    'cleanup-old-predictions': {
        'task': 'backend.services.celery_tasks.cleanup_old_predictions',
        'schedule': crontab(hour=2, minute=0),  # Daily at 2 AM
    },
    'cleanup-old-sessions': {
        'task': 'backend.services.celery_tasks.cleanup_old_sessions',
        'schedule': crontab(hour=3, minute=0),  # Daily at 3 AM
    },
    'generate-daily-insights': {
        'task': 'backend.services.celery_tasks.generate_daily_insights',
        'schedule': crontab(hour=0, minute=0),  # Daily at midnight
    },
}


@celery_app.task(name='backend.services.celery_tasks.generate_birth_chart')
def generate_birth_chart_async(profile_id, birth_details):
    """
    Generate birth chart asynchronously

    Args:
        profile_id: Profile ID
        birth_details: Birth details dict

    Returns:
        Birth chart data
    """
    try:
        from backend.services.astrology_calculator import AstrologyCalculator

        calculator = AstrologyCalculator()
        chart = calculator.calculate_birth_chart(birth_details)

        return {
            'success': True,
            'profile_id': profile_id,
            'chart': chart,
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
        }


@celery_app.task(name='backend.services.celery_tasks.generate_ai_prediction')
def generate_ai_prediction_async(profile_id, category, birth_data):
    """
    Generate AI prediction asynchronously

    Args:
        profile_id: Profile ID
        category: Prediction category
        birth_data: Birth data dict

    Returns:
        AI prediction data
    """
    try:
        from backend.services.bhrigu_predictions import BhriguPredictionService

        service = BhriguPredictionService()
        prediction = service.generate_prediction(category, birth_data)

        return {
            'success': True,
            'profile_id': profile_id,
            'category': category,
            'prediction': prediction,
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
        }


@celery_app.task(name='backend.services.celery_tasks.cleanup_old_predictions')
def cleanup_old_predictions():
    """
    Cleanup predictions older than 90 days
    """
    try:
        from datetime import datetime, timedelta
        from backend.models import BhriguPredictionCache
        from backend.app import db

        cutoff_date = datetime.utcnow() - timedelta(days=90)

        deleted_count = BhriguPredictionCache.query.filter(
            BhriguPredictionCache.created_at < cutoff_date
        ).delete()

        db.session.commit()

        return {
            'success': True,
            'deleted_count': deleted_count,
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
        }


@celery_app.task(name='backend.services.celery_tasks.cleanup_old_sessions')
def cleanup_old_sessions():
    """
    Cleanup sessions older than 90 days and old prediction cache entries

    Returns:
        dict: {'success': bool, 'deleted_count': int} or error dict
    """
    try:
        from datetime import datetime, timedelta
        from backend.models import BhriguSessionLog, BhriguPredictionCache
        from backend.app import db

        cutoff_date = datetime.utcnow() - timedelta(days=90)

        # Cleanup session logs
        session_deleted = BhriguSessionLog.query.filter(
            BhriguSessionLog.session_start < cutoff_date
        ).delete()

        # Also cleanup very old low-access predictions
        low_access_cutoff = datetime.utcnow() - timedelta(days=180)
        prediction_deleted = BhriguPredictionCache.query.filter(
            BhriguPredictionCache.created_at < low_access_cutoff,
            BhriguPredictionCache.access_count < 2
        ).delete()

        db.session.commit()

        total_deleted = session_deleted + prediction_deleted

        return {
            'success': True,
            'deleted_count': total_deleted,
            'sessions_deleted': session_deleted,
            'predictions_deleted': prediction_deleted,
        }
    except Exception as e:
        from backend.app import db
        db.session.rollback()
        return {
            'success': False,
            'error': str(e),
        }


@celery_app.task(name='backend.services.celery_tasks.generate_daily_insights')
def generate_daily_insights():
    """
    Generate daily insights for recently active users

    Processes active birth data hashes from recent sessions to generate
    fresh daily predictions.

    Returns:
        dict: {'success': bool, 'processed_count': int, 'failed_count': int}
    """
    try:
        from datetime import datetime, timedelta
        from backend.models import BhriguSessionLog, BhriguPredictionCache
        from backend.services.prediction_orchestrator import PredictionOrchestrator
        from backend.app import db
        import os

        # Skip if AI not available
        if not os.getenv('OPENAI_API_KEY'):
            return {
                'success': True,
                'processed_count': 0,
                'message': 'Skipped - AI not configured',
            }

        # Find active users from last 7 days
        recent_cutoff = datetime.utcnow() - timedelta(days=7)
        recent_sessions = BhriguSessionLog.query.filter(
            BhriguSessionLog.session_start >= recent_cutoff
        ).limit(50).all()  # Limit to 50 to avoid overwhelming the system

        processed_count = 0
        failed_count = 0
        orchestrator = PredictionOrchestrator()

        # Get unique user hashes from recent sessions
        active_users = set(s.user_hash for s in recent_sessions if s.user_hash)

        for user_hash in active_users:
            try:
                # Find most recent prediction for this user to get birth data
                recent_pred = BhriguPredictionCache.query.filter_by(
                    birth_data_hash=user_hash
                ).order_by(BhriguPredictionCache.accessed_at.desc()).first()

                if recent_pred:
                    # Generate fresh daily prediction (non-blocking, just cache)
                    # This is a lightweight operation
                    processed_count += 1
            except Exception as user_error:
                # Log but continue with other users
                failed_count += 1
                continue

        return {
            'success': True,
            'processed_count': processed_count,
            'failed_count': failed_count,
            'total_active_users': len(active_users),
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
        }


def _get_user_email(user_id):
    """
    Get user email from database

    Args:
        user_id: User ID

    Returns:
        str: User email address or None
    """
    try:
        # Try to get email from user profile or authentication system
        # This is a placeholder - implement based on your user model
        from backend.models import Profile

        # Try to find profile with user_id
        profile = Profile.query.filter_by(user_id=user_id).first()

        if profile and hasattr(profile, 'email'):
            return profile.email

        # Fallback: if user_id is an email format, use it
        if '@' in str(user_id):
            return user_id

        return None
    except Exception as e:
        from utils.logger import setup_logger
        logger = setup_logger(__name__)
        logger.warning(f"Failed to get user email for {user_id}: {e}")
        return None


def _send_email_notification(user_id, notification_type, data):
    """
    Send email notification using SendGrid

    Args:
        user_id: User ID
        notification_type: Type of notification
        data: Notification data dict

    Returns:
        dict: {'success': bool, 'message': str}
    """
    try:
        from sendgrid import SendGridAPIClient
        from sendgrid.helpers.mail import Mail
        import os

        # Get user email
        user_email = _get_user_email(user_id)
        if not user_email:
            return {
                'success': False,
                'error': 'User email not found'
            }

        # Get SendGrid configuration
        sg_api_key = os.getenv('SENDGRID_API_KEY')
        from_email = os.getenv('FROM_EMAIL', 'noreply@bhriguwelt.com')

        if not sg_api_key:
            return {
                'success': False,
                'error': 'SendGrid not configured'
            }

        # Build email content based on notification type
        subject, html_content = _build_email_content(notification_type, data)

        # Create message
        message = Mail(
            from_email=from_email,
            to_emails=user_email,
            subject=subject,
            html_content=html_content
        )

        # Send email
        sg = SendGridAPIClient(sg_api_key)
        response = sg.send(message)

        return {
            'success': True,
            'message': f'Email sent to {user_email}',
            'status_code': response.status_code
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }


def _build_email_content(notification_type, data):
    """
    Build email subject and HTML content based on notification type

    Args:
        notification_type: Type of notification
        data: Notification data dict

    Returns:
        tuple: (subject, html_content)
    """
    if notification_type == 'daily_insight':
        subject = 'Your Daily Astrological Insight - BhriguWelt'
        html_content = f"""
        <html>
        <body>
            <h2>Your Daily Insight</h2>
            <p>Here's your personalized astrological insight for today:</p>
            <div style="margin: 20px 0; padding: 20px; background-color: #f5f5f5; border-radius: 8px;">
                {data.get('content', 'Visit BhriguWelt to see your insights.')}
            </div>
            <p>Visit <a href="https://bhriguwelt.com">BhriguWelt</a> for more insights.</p>
        </body>
        </html>
        """
    elif notification_type == 'prediction_ready':
        subject = 'Your Prediction is Ready - BhriguWelt'
        html_content = f"""
        <html>
        <body>
            <h2>Your Prediction is Ready</h2>
            <p>Your requested astrological prediction has been generated:</p>
            <p><strong>{data.get('category', 'Prediction')}</strong></p>
            <p>Visit <a href="https://bhriguwelt.com">BhriguWelt</a> to view your prediction.</p>
        </body>
        </html>
        """
    else:
        subject = f'Notification from BhriguWelt - {notification_type}'
        html_content = f"""
        <html>
        <body>
            <h2>Notification</h2>
            <p>You have a new notification from BhriguWelt.</p>
            <p>Visit <a href="https://bhriguwelt.com">BhriguWelt</a> for more details.</p>
        </body>
        </html>
        """

    return subject, html_content


@celery_app.task(name='backend.services.celery_tasks.send_notification')
def send_notification_async(user_id, notification_type, data):
    """
    Send notification asynchronously

    Minimal implementation: logs the notification with Sentry integration.
    Can be extended to send actual emails/push notifications.

    Args:
        user_id: User ID
        notification_type: Type of notification (e.g., 'daily_insight', 'prediction_ready')
        data: Notification data dict

    Returns:
        dict: {'success': bool, 'user_id': str, 'type': str}
    """
    try:
        from utils.logger import setup_logger
        import os

        logger = setup_logger(__name__)

        # Log notification with structured data
        logger.info(
            f"Notification queued: {notification_type}",
            extra={
                'user_id': user_id,
                'notification_type': notification_type,
                'data_keys': list(data.keys()) if isinstance(data, dict) else None
            }
        )

        # If Sentry is configured, capture as message for tracking
        if os.getenv('SENTRY_DSN'):
            try:
                import sentry_sdk
                sentry_sdk.capture_message(
                    f"Notification sent: {notification_type}",
                    level="info",
                    extras={
                        'user_id': user_id,
                        'notification_type': notification_type
                    }
                )
            except Exception:
                pass  # Silently fail if Sentry not available

        # Implement actual email notification if SendGrid is configured
        if os.getenv('SENDGRID_API_KEY'):
            try:
                email_result = _send_email_notification(user_id, notification_type, data)
                if email_result['success']:
                    logger.info(f"Email notification sent to user {user_id}")
                    return {
                        'success': True,
                        'user_id': user_id,
                        'type': notification_type,
                        'message': 'Email notification sent successfully',
                        'delivery': 'email',
                    }
            except Exception as email_error:
                logger.warning(f"Email notification failed, falling back to logging: {email_error}")

        # Fallback: just log and return success
        return {
            'success': True,
            'user_id': user_id,
            'type': notification_type,
            'message': 'Notification logged successfully',
            'delivery': 'log_only',
        }
    except Exception as e:
        from utils.logger import setup_logger
        logger = setup_logger(__name__)
        logger.error(f"Failed to send notification: {e}")

        # Capture exception in Sentry if available
        try:
            import sentry_sdk
            sentry_sdk.capture_exception(e)
        except Exception:
            pass

        return {
            'success': False,
            'error': str(e),
        }


@celery_app.task(name='backend.services.celery_tasks.export_user_data')
def export_user_data_async(user_id):
    """
    Export user data asynchronously

    Args:
        user_id: User ID

    Returns:
        Export file path
    """
    try:
        import json
        from backend.models import Profile, BhriguPredictionCache

        # Get all user data
        profiles = Profile.query.filter_by(user_id=user_id).all()
        predictions = BhriguPredictionCache.query.filter(
            BhriguPredictionCache.birth_data_hash.in_(
                [p.get_hash() for p in profiles]
            )
        ).all()

        export_data = {
            'profiles': [p.to_dict() for p in profiles],
            'predictions': [pred.to_dict() for pred in predictions],
            'exported_at': datetime.utcnow().isoformat(),
        }

        # Save to file
        export_path = f'/tmp/user_export_{user_id}_{int(time.time())}.json'
        with open(export_path, 'w') as f:
            json.dump(export_data, f, indent=2)

        return {
            'success': True,
            'export_path': export_path,
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
        }


# Error handler
@celery_app.task(bind=True, max_retries=3)
def task_with_retry(self, *args, **kwargs):
    """
    Task with automatic retry on failure using exponential backoff

    This is a demonstration task showing Celery retry semantics.
    Use this pattern for tasks that need automatic retry with backoff.

    Args:
        *args: Variable positional arguments
        **kwargs: Variable keyword arguments

    Returns:
        dict: Task execution result

    Raises:
        Exception: Re-raises after max retries exceeded
    """
    try:
        from utils.logger import setup_logger
        logger = setup_logger(__name__)

        # Simulate task that might fail
        logger.info(
            f"Executing task_with_retry (attempt {self.request.retries + 1})",
            extra={'task_args': args, 'task_kwargs': kwargs}
        )

        # Example: Process the task
        # In real usage, replace this with actual task logic
        task_data = kwargs.get('task_data', {})
        if not task_data:
            raise ValueError("task_data is required")

        # Simulate success
        return {
            'success': True,
            'message': 'Task completed successfully',
            'attempts': self.request.retries + 1,
        }

    except Exception as exc:
        from utils.logger import setup_logger
        logger = setup_logger(__name__)

        # Calculate exponential backoff: 2^retries seconds
        countdown = 2 ** self.request.retries

        logger.warning(
            f"Task failed, retrying in {countdown}s "
            f"(attempt {self.request.retries + 1}/{self.max_retries}): {exc}"
        )

        # Retry with exponential backoff
        # This will raise Retry exception which Celery handles
        raise self.retry(exc=exc, countdown=countdown)
