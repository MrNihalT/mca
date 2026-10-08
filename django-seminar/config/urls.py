"""
config/urls.py - the ROOT url file (settings.ROOT_URLCONF points here).

It does not contain views. It delegates to each app with include().
"""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

from todo.api import router

urlpatterns = [
    path("admin/", admin.site.urls),  # built-in admin panel
    path("api/", include(router.urls)),  # DRF API
    path("api-auth/", include("rest_framework.urls")),  # login button in the browsable API
    path("", include("todo.urls")),  # our HTML pages
]

# In development only: serve uploaded media files (task images).
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
