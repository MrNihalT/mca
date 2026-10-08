# Bonus: file and image handling

> This is **not part of the seminar**. It is here so you know Django can do it, and so you can try it yourself.

The `Item` model already has an optional image field, so it works out of the box.

## How it works

**1. Model** ([`items/models.py`](../items/models.py)): an `ImageField` stores the *path* of the file in the database; the file itself is saved on disk.

```python
image = models.ImageField(upload_to="item_images/", null=True, blank=True)
```

`ImageField` needs the **Pillow** library (already in `requirements.txt`).

**2. Settings** ([`config/settings.py`](../config/settings.py)): where uploaded files are stored and the URL they are served from.

```python
MEDIA_ROOT = BASE_DIR / "media"   # folder on disk
MEDIA_URL = "media/"              # URL prefix
```

**3. URLs** ([`config/urls.py`](../config/urls.py)): while developing (`DEBUG = True`) Django serves the media files.

```python
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

**4. Serializer** ([`items/serializers.py`](../items/serializers.py)): `image` is listed in `fields`, so the API returns the file URL.

## Try it

**In the admin**

1. Run the server and open <http://127.0.0.1:8000/admin/items/item/>.
2. Open an item. Use **Image > Choose File**, then **Save**.
3. Open <http://127.0.0.1:8000/api/items/>. The item now shows `"image": "/media/item_images/<file>"`.
4. Open `http://127.0.0.1:8000/media/item_images/<file>` to see the picture.

**With the API**

Send the request as `multipart/form-data` (the browsable API page can do this too):

```bash
curl -X POST http://127.0.0.1:8000/api/items/ -F "name=Mug" -F "price=120" -F "quantity=10" -F "image=@mug.jpg"
```

Uploaded files are saved in the `media/` folder. That folder's contents are ignored by Git (see `.gitignore`).

## Good to know

- Always set a sensible `upload_to`, so files from different models do not mix.
- In production, a web server or cloud storage (for example Amazon S3) serves media files, not Django.
- Never trust uploaded files blindly: validate file type and size. `ImageField` already checks that the file is a real image.
- The same idea works for any file with `FileField`.
