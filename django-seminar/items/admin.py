"""
admin.py - registers our model with the built-in admin panel (/admin/).

A ModelAdmin class controls HOW the model looks and behaves there.
"""

from django.contrib import admin

from .models import Item


@admin.register(Item)  # same as admin.site.register(Item, ItemAdmin)
class ItemAdmin(admin.ModelAdmin):
    # Columns shown in the list page.
    list_display = ("name", "price", "quantity", "is_available", "created_at")

    # Filter sidebar on the right.
    list_filter = ("is_available",)

    # Search box at the top.
    search_fields = ("name", "description")

    # Default sort order.
    ordering = ("-created_at",)

    # Edit these fields directly in the list page.
    list_editable = ("price", "quantity", "is_available")

    # created_at is automatic, so show it read-only on the edit form.
    readonly_fields = ("created_at",)

    # Custom bulk actions (dropdown above the list).
    actions = ["mark_available", "mark_unavailable"]

    @admin.action(description="Mark selected items as available")
    def mark_available(self, request, queryset):
        updated = queryset.update(is_available=True)
        self.message_user(request, f"{updated} item(s) marked as available.")

    @admin.action(description="Mark selected items as unavailable")
    def mark_unavailable(self, request, queryset):
        updated = queryset.update(is_available=False)
        self.message_user(request, f"{updated} item(s) marked as unavailable.")


# Customise the text at the top of the admin site.
admin.site.site_header = "Django Seminar - Items Admin"
admin.site.site_title = "Items Admin"
admin.site.index_title = "Manage your items"
