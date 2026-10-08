"""
models.py - the "M" in MVT.

Each class that inherits from models.Model becomes ONE database table.
Each attribute (a Field) becomes ONE column in that table.

    Python class  ->  table
    Python field  ->  column
    object        ->  row
"""

from django.db import models


class Item(models.Model):
    """A simple product in a shop.  Table: items_item"""

    name = models.CharField(max_length=100)  # VARCHAR(100)
    description = models.TextField(blank=True)  # TEXT, may be left empty
    price = models.DecimalField(max_digits=8, decimal_places=2)  # DECIMAL(8, 2)
    quantity = models.PositiveIntegerField(default=0)  # INTEGER >= 0
    is_available = models.BooleanField(default=True)  # BOOLEAN
    created_at = models.DateTimeField(auto_now_add=True)  # set once, on create

    # Bonus (not part of the seminar): image upload. Needs Pillow.
    # See docs/image-handling.md. Files are saved inside MEDIA_ROOT/item_images/
    image = models.ImageField(upload_to="item_images/", null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]  # newest first

    def __str__(self):
        # What you see in the admin and in the shell.
        return self.name
