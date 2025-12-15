"""
Background job for cleaning up orphaned videos from Firebase Storage.

Orphaned videos are files that:
1. Exist in Firebase Storage under /assessments
2. Are NOT referenced by any assessment document in Firestore
3. Are older than 24 hours (to avoid race conditions during active uploads)

This job should be run daily via a cron scheduler (e.g., Render Cron Jobs).

Usage:
  python -m app.jobs.cleanup_orphaned_videos --dry-run  # Preview deletions
  python -m app.jobs.cleanup_orphaned_videos            # Execute cleanup
"""

import argparse
import logging
from datetime import datetime, timedelta, timezone
from typing import Set

from google.cloud import firestore, storage

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s'
)
logger = logging.getLogger(__name__)


async def cleanup_orphaned_videos(dry_run: bool = True) -> dict:
    """
    Find and delete orphaned videos from Firebase Storage.

    Args:
        dry_run: If True, only report what would be deleted (no actual deletions)

    Returns:
        Dictionary with cleanup statistics:
        {
            'total_videos': int,           # Total videos in storage
            'referenced_videos': int,       # Videos referenced in Firestore
            'orphaned_videos': int,         # Videos not referenced
            'too_young_videos': int,        # Orphaned but <24h old (skipped)
            'deleted_count': int,           # Videos actually deleted
            'dry_run': bool,                # Whether this was a dry run
            'errors': [str],                # Any errors encountered
        }
    """
    stats = {
        'total_videos': 0,
        'referenced_videos': 0,
        'orphaned_videos': 0,
        'too_young_videos': 0,
        'deleted_count': 0,
        'dry_run': dry_run,
        'errors': [],
    }

    try:
        # Initialize Firebase clients
        storage_client = storage.Client()
        bucket = storage_client.bucket(storage_client.list_buckets().next().name)
        db = firestore.Client()

        logger.info('Starting orphaned video cleanup (dry_run=%s)', dry_run)

        # 1. Get all video files from Storage
        logger.info('Scanning Firebase Storage for assessment videos...')
        blobs = bucket.list_blobs(prefix='assessments/')
        storage_paths: Set[str] = {blob.name for blob in blobs}
        stats['total_videos'] = len(storage_paths)
        logger.info('Found %d videos in storage', stats['total_videos'])

        # 2. Get all referenced video paths from Firestore
        logger.info('Scanning Firestore for referenced videos...')
        referenced_paths: Set[str] = set()

        assessments = db.collection('assessments').stream()
        for doc in assessments:
            data = doc.to_dict()
            if not data:
                continue

            # Single-leg assessment
            if data.get('video_path'):
                referenced_paths.add(data['video_path'])

            # Dual-leg assessment
            if data.get('left_leg_video_path'):
                referenced_paths.add(data['left_leg_video_path'])
            if data.get('right_leg_video_path'):
                referenced_paths.add(data['right_leg_video_path'])

        stats['referenced_videos'] = len(referenced_paths)
        logger.info('Found %d referenced videos in Firestore', stats['referenced_videos'])

        # 3. Identify orphaned videos
        orphaned_paths: Set[str] = storage_paths - referenced_paths
        stats['orphaned_videos'] = len(orphaned_paths)
        logger.info('Found %d orphaned videos', stats['orphaned_videos'])

        if not orphaned_paths:
            logger.info('No orphaned videos to clean up')
            return stats

        # 4. Filter by age (only delete videos >24h old to avoid race conditions)
        cutoff_time = datetime.now(timezone.utc) - timedelta(hours=24)
        deletable_paths = []

        for path in orphaned_paths:
            blob = bucket.blob(path)
            blob.reload()  # Fetch metadata

            if blob.time_created and blob.time_created < cutoff_time:
                deletable_paths.append(path)
            else:
                stats['too_young_videos'] += 1
                logger.debug('Skipping young orphaned video (age <24h): %s', path)

        logger.info('Found %d orphaned videos older than 24 hours', len(deletable_paths))

        # 5. Delete orphaned videos
        if dry_run:
            logger.info('[DRY RUN] Would delete %d videos', len(deletable_paths))
            for path in deletable_paths:
                logger.info('[DRY RUN] Would delete: %s', path)
            return stats

        logger.info('Deleting %d orphaned videos...', len(deletable_paths))
        for path in deletable_paths:
            try:
                blob = bucket.blob(path)
                blob.delete()
                stats['deleted_count'] += 1
                logger.info('Deleted: %s', path)
            except Exception as err:
                error_msg = f'Failed to delete {path}: {str(err)}'
                logger.error(error_msg)
                stats['errors'].append(error_msg)

        logger.info(
            'Cleanup completed: %d deleted, %d errors',
            stats['deleted_count'],
            len(stats['errors'])
        )

        return stats

    except Exception as err:
        error_msg = f'Cleanup job failed: {str(err)}'
        logger.error(error_msg, exc_info=True)
        stats['errors'].append(error_msg)
        return stats


async def main():
    """CLI entry point for the cleanup job."""
    parser = argparse.ArgumentParser(
        description='Clean up orphaned videos from Firebase Storage'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Preview deletions without actually deleting'
    )

    args = parser.parse_args()

    stats = await cleanup_orphaned_videos(dry_run=args.dry_run)

    # Print summary
    print('\n=== Cleanup Summary ===')
    print(f'Total videos in storage: {stats["total_videos"]}')
    print(f'Referenced videos: {stats["referenced_videos"]}')
    print(f'Orphaned videos: {stats["orphaned_videos"]}')
    print(f'Too young to delete (<24h): {stats["too_young_videos"]}')
    print(f'Deleted: {stats["deleted_count"]}')
    if stats['errors']:
        print(f'Errors: {len(stats["errors"])}')
        for error in stats['errors']:
            print(f'  - {error}')
    print(f'Dry run: {stats["dry_run"]}')

    return stats


if __name__ == '__main__':
    import asyncio
    asyncio.run(main())
