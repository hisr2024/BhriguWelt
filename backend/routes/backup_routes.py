"""
Backup and Recovery API Routes
Provides endpoints for triggering backups and checking backup status
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
import subprocess
import os
import glob
from datetime import datetime
from pathlib import Path
from utils.logger import setup_logger, log_exception

logger = setup_logger(__name__)
backup_bp = Blueprint('backup', __name__, url_prefix='/api/backup')

BACKUP_DIR = os.getenv('BACKUP_DIR', '/app/backups')
BACKUP_SCRIPT = Path(__file__).parent.parent / 'scripts' / 'backup.sh'
RESTORE_SCRIPT = Path(__file__).parent.parent / 'scripts' / 'restore.sh'


@backup_bp.route('/trigger', methods=['POST'])
@jwt_required()
def trigger_backup():
    """
    Trigger a manual backup
    Requires authentication
    """
    try:
        user_id = get_jwt_identity()
        logger.info(f"Manual backup triggered by user: {user_id}")

        # Check if backup script exists
        if not BACKUP_SCRIPT.exists():
            return jsonify({
                'error': 'Backup script not found',
                'message': 'Backup functionality is not configured'
            }), 500

        # Run backup script
        result = subprocess.run(
            [str(BACKUP_SCRIPT)],
            capture_output=True,
            text=True,
            timeout=300  # 5 minutes timeout
        )

        if result.returncode == 0:
            logger.info(f"Backup completed successfully by user: {user_id}")
            return jsonify({
                'status': 'success',
                'message': 'Backup completed successfully',
                'output': result.stdout
            }), 200
        else:
            logger.error(f"Backup failed: {result.stderr}")
            return jsonify({
                'error': 'Backup failed',
                'message': result.stderr
            }), 500

    except subprocess.TimeoutExpired:
        return jsonify({
            'error': 'Backup timeout',
            'message': 'Backup took too long to complete'
        }), 500
    except Exception as e:
        log_exception(logger, e, context="Failed to trigger backup")
        return jsonify({
            'error': 'Backup failed',
            'message': str(e)
        }), 500


@backup_bp.route('/list', methods=['GET'])
@jwt_required()
def list_backups():
    """
    List available backups
    Requires authentication
    """
    try:
        # Find all backup files
        backup_pattern = os.path.join(BACKUP_DIR, 'bhriguwelt_backup_*.tar.gz')
        backup_files = glob.glob(backup_pattern)

        backups = []
        for backup_file in sorted(backup_files, reverse=True):
            stat = os.stat(backup_file)
            backups.append({
                'filename': os.path.basename(backup_file),
                'path': backup_file,
                'size': stat.st_size,
                'size_human': _format_size(stat.st_size),
                'created': datetime.fromtimestamp(stat.st_mtime).isoformat(),
                'age_days': (datetime.now() - datetime.fromtimestamp(stat.st_mtime)).days
            })

        return jsonify({
            'backups': backups,
            'total': len(backups),
            'total_size': sum(b['size'] for b in backups),
            'total_size_human': _format_size(sum(b['size'] for b in backups))
        }), 200

    except Exception as e:
        log_exception(logger, e, context="Failed to list backups")
        return jsonify({
            'error': 'Failed to list backups',
            'message': str(e)
        }), 500


@backup_bp.route('/status', methods=['GET'])
@jwt_required()
def backup_status():
    """
    Get backup system status
    Requires authentication
    """
    try:
        # Check if backup directory exists
        backup_dir_exists = os.path.isdir(BACKUP_DIR)

        # Get latest backup
        backup_pattern = os.path.join(BACKUP_DIR, 'bhriguwelt_backup_*.tar.gz')
        backup_files = sorted(glob.glob(backup_pattern), reverse=True)
        latest_backup = None

        if backup_files:
            latest_file = backup_files[0]
            stat = os.stat(latest_file)
            latest_backup = {
                'filename': os.path.basename(latest_file),
                'size_human': _format_size(stat.st_size),
                'created': datetime.fromtimestamp(stat.st_mtime).isoformat(),
                'age_hours': int((datetime.now() - datetime.fromtimestamp(stat.st_mtime)).total_seconds() / 3600)
            }

        # Check backup script
        backup_script_exists = BACKUP_SCRIPT.exists()
        restore_script_exists = RESTORE_SCRIPT.exists()

        # Get disk usage
        if backup_dir_exists:
            stat_vfs = os.statvfs(BACKUP_DIR)
            disk_total = stat_vfs.f_blocks * stat_vfs.f_frsize
            disk_free = stat_vfs.f_bavail * stat_vfs.f_frsize
            disk_used = disk_total - disk_free
        else:
            disk_total = disk_free = disk_used = 0

        return jsonify({
            'status': 'operational' if backup_script_exists else 'unavailable',
            'backup_directory': {
                'path': BACKUP_DIR,
                'exists': backup_dir_exists,
                'writable': os.access(BACKUP_DIR, os.W_OK) if backup_dir_exists else False
            },
            'scripts': {
                'backup': backup_script_exists,
                'restore': restore_script_exists
            },
            'latest_backup': latest_backup,
            'total_backups': len(backup_files),
            'disk_usage': {
                'total': disk_total,
                'used': disk_used,
                'free': disk_free,
                'total_human': _format_size(disk_total),
                'used_human': _format_size(disk_used),
                'free_human': _format_size(disk_free),
                'percent_used': round((disk_used / disk_total * 100) if disk_total > 0 else 0, 2)
            },
            'retention_days': int(os.getenv('BACKUP_RETENTION_DAYS', 30))
        }), 200

    except Exception as e:
        log_exception(logger, e, context="Failed to get backup status")
        return jsonify({
            'error': 'Failed to get backup status',
            'message': str(e)
        }), 500


@backup_bp.route('/delete/<filename>', methods=['DELETE'])
@jwt_required()
def delete_backup(filename):
    """
    Delete a specific backup
    Requires authentication
    """
    try:
        user_id = get_jwt_identity()

        # Validate filename
        if not filename.startswith('bhriguwelt_backup_') or not filename.endswith('.tar.gz'):
            return jsonify({
                'error': 'Invalid filename',
                'message': 'Backup filename must match pattern: bhriguwelt_backup_*.tar.gz'
            }), 400

        # Construct full path
        backup_path = os.path.join(BACKUP_DIR, filename)

        # Check if file exists
        if not os.path.isfile(backup_path):
            return jsonify({
                'error': 'Backup not found',
                'message': f'Backup file does not exist: {filename}'
            }), 404

        # Delete backup
        os.remove(backup_path)
        logger.info(f"Backup deleted by user {user_id}: {filename}")

        return jsonify({
            'status': 'success',
            'message': f'Backup deleted: {filename}'
        }), 200

    except Exception as e:
        log_exception(logger, e, context="Failed to delete backup")
        return jsonify({
            'error': 'Failed to delete backup',
            'message': str(e)
        }), 500


def _format_size(bytes_size):
    """Format bytes to human-readable size"""
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if bytes_size < 1024.0:
            return f"{bytes_size:.2f} {unit}"
        bytes_size /= 1024.0
    return f"{bytes_size:.2f} PB"
