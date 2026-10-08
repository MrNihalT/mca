"""
items/urls.py - the URL routes of the items app.

A URL pattern maps a path to a view function:

    /api/items/3/   ->   views.item_detail(request, pk=3)
"""

from django.urls import path

from . import views

urlpatterns = [
    path("items/", views.item_list, name="item_list"),
    path("items/<int:pk>/", views.item_detail, name="item_detail"),
]
