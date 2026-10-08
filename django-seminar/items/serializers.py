"""
serializers.py - Django REST Framework (DRF).

A serializer converts model objects <-> JSON, and validates incoming JSON.
In an API project it takes the place of the template (the "T" in MVT).
"""

from rest_framework import serializers

from .models import Item


class ItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = Item
        fields = ["id", "name", "description", "price", "quantity", "is_available", "image", "created_at"]
        read_only_fields = ["created_at"]
