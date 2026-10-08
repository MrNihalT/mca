"""
A custom management command:  python manage.py seed_demo
Creates a few sample items so the API is not empty.
"""

from django.core.management.base import BaseCommand

from items.models import Item


class Command(BaseCommand):
    help = "Create sample items for the seminar demo."

    def handle(self, *args, **options):
        samples = [
            ("Notebook", "A4 ruled notebook, 200 pages", "60.00", 40, True),
            ("Ball pen pack", "Pack of 10 blue pens", "25.00", 120, True),
            ("USB cable", "1 metre Type-C cable", "149.00", 15, True),
            ("Backpack", "Water-resistant college bag", "799.00", 0, False),
        ]
        created = 0
        for name, description, price, quantity, available in samples:
            _, was_created = Item.objects.get_or_create(
                name=name,
                defaults={"description": description, "price": price, "quantity": quantity, "is_available": available},
            )
            created += was_created
        self.stdout.write(self.style.SUCCESS(f"Done. {created} new item(s) created."))
