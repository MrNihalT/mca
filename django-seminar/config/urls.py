"""
config/urls.py - the ROOT url file (settings.ROOT_URLCONF points here).

It does not contain views. It delegates to each app with include().
"""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from django.views.generic import RedirectView

urlpatterns = [
    path("admin/", admin.site.urls),  # built-in admin panel
    path("api/", include("items.urls")),  # our API  ->  /api/items/
    path("", RedirectView.as_view(url="/api/items/")),  # home page -> the API
]

# In development only: serve uploaded media files (item images).
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
