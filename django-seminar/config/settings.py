"""
settings.py - the control panel of a Django project.

Every Django project has exactly one settings module. Django reads it at
start-up to find out: which apps are installed, which database to use,
which middleware to run, where templates / static / media files live, etc.
"""

from pathlib import Path

# BASE_DIR = the folder that contains manage.py.
# Building paths from it means the project works on Windows, Mac and Linux.
BASE_DIR = Path(__file__).resolve().parent.parent


# ---------------------------------------------------------------------------
# 1. SECURITY
# ---------------------------------------------------------------------------
# SECRET_KEY signs sessions, CSRF tokens, password-reset links, etc.
# This one is for LEARNING ONLY. In a real project load it from an
# environment variable and never commit it to GitHub.
SECRET_KEY = "django-insecure-seminar-demo-key-do-not-use-in-production"

# DEBUG=True shows detailed error pages. Always False in production.
DEBUG = True

# Host names this site may serve. Empty list + DEBUG=True allows localhost.
ALLOWED_HOSTS = []


# ---------------------------------------------------------------------------
# 2. INSTALLED APPS  (a project is a collection of apps)
# ---------------------------------------------------------------------------
INSTALLED_APPS = [
    # --- Built-in Django apps ---
    "django.contrib.admin",  # the admin panel
    "django.contrib.auth",  # users, groups, permissions
    "django.contrib.contenttypes",
    "django.contrib.sessions",  # login sessions
    "django.contrib.messages",  # flash messages ("Task saved!")
    "django.contrib.staticfiles",  # CSS / JS / images
    # --- Third-party apps ---
    "rest_framework",  # Django REST Framework (DRF)
    # --- Our own apps ---
    "items",
]


# ---------------------------------------------------------------------------
# 3. MIDDLEWARE  (runs on every request, top to bottom, and back up again)
# ---------------------------------------------------------------------------
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",  # HTTPS / security headers
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",  # CSRF protection
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",  # clickjacking
]


# ---------------------------------------------------------------------------
# 4. URLS, TEMPLATES, WSGI
# ---------------------------------------------------------------------------
# Django starts URL matching in this file.
ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        # Our API returns JSON, so we have no templates of our own.
        # This setting is still required: the admin panel uses templates.
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"


# ---------------------------------------------------------------------------
# 5. DATABASE
# ---------------------------------------------------------------------------
# Default: SQLite. It is a single file (db.sqlite3), needs NO installation
# and is perfect for learning. Django's ORM hides the differences, so the
# same models work on any database below.
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

# --- Connecting an EXTERNAL database (last part of the seminar) -----------
# Only the DATABASES setting changes. Your models, views and admin stay the same.
#
# PostgreSQL   ->  pip install psycopg2-binary
# DATABASES = {
#     "default": {
#         "ENGINE": "django.db.backends.postgresql",
#         "NAME": "todo_db",
#         "USER": "postgres",
#         "PASSWORD": "your-password",   # use environment variables in real life!
#         "HOST": "localhost",
#         "PORT": "5432",
#     }
# }
#
# MySQL        ->  pip install mysqlclient
# DATABASES = {
#     "default": {
#         "ENGINE": "django.db.backends.mysql",
#         "NAME": "todo_db",
#         "USER": "root",
#         "PASSWORD": "your-password",
#         "HOST": "localhost",
#         "PORT": "3306",
#     }
# }
#
# After changing the database run:  python manage.py migrate


# ---------------------------------------------------------------------------
# 6. PASSWORD VALIDATION  (used when creating users / superusers)
# ---------------------------------------------------------------------------
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]


# ---------------------------------------------------------------------------
# 7. INTERNATIONALISATION
# ---------------------------------------------------------------------------
LANGUAGE_CODE = "en-us"
TIME_ZONE = "Asia/Kolkata"  # change to your own time zone
USE_I18N = True
USE_TZ = True  # store datetimes in UTC, show them in TIME_ZONE


# ---------------------------------------------------------------------------
# 8. STATIC FILES (CSS/JS shipped with the code) and MEDIA FILES (user uploads)
# ---------------------------------------------------------------------------
STATIC_URL = "static/"

# Uploaded files (e.g. the image on a task) are saved here ...
MEDIA_ROOT = BASE_DIR / "media"
# ... and served from this URL.
MEDIA_URL = "media/"


# ---------------------------------------------------------------------------
# 9. MISC
# ---------------------------------------------------------------------------
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Django REST Framework configuration.
REST_FRAMEWORK = {
    # For the seminar, anyone can use the API (no login needed).
    # In a real project use IsAuthenticated or IsAuthenticatedOrReadOnly.
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.AllowAny",
    ],
}
