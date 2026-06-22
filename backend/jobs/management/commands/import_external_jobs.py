from django.core.management.base import BaseCommand
from jobs.scrapers import sync_jobs

class Command(BaseCommand):
    help = "Imports/syncs external jobs from LinkedIn and Internshala into the local database."

    def add_arguments(self, parser):
        parser.add_argument(
            '--keyword',
            '-k',
            type=str,
            default='React',
            help='Keyword search term for external jobs (e.g. React, Python, Django).'
        )
        parser.add_argument(
            '--limit',
            '-l',
            type=int,
            default=5,
            help='Maximum number of jobs to fetch per source.'
        )
        parser.add_argument(
            '--source',
            '-s',
            type=str,
            default='both',
            choices=['linkedin', 'internshala', 'both'],
            help='External source to import from.'
        )

    def handle(self, *args, **options):
        keyword = options['keyword']
        limit = options['limit']
        source = options['source']

        self.stdout.write(self.style.WARNING(
            f"Starting external job sync for keyword='{keyword}' (source='{source}', limit={limit})..."
        ))

        try:
            count = sync_jobs(keyword=keyword, limit=limit, source_type=source)
            self.stdout.write(self.style.SUCCESS(
                f"Successfully synced jobs. Imported {count} new external listing(s) into the database."
            ))
        except Exception as e:
            self.stderr.write(self.style.ERROR(
                f"An error occurred while syncing jobs: {e}"
            ))
