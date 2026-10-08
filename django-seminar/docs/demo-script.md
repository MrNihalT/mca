# Live demo script (about 10-15 minutes)

Use this while presenting the slides (slide 27, "Demo: Item API with CRUD", onwards in the deck). Everything is already in the repo, so the demo is only *running* and *showing* things.

## Before the seminar

1. Follow the [README setup](../README.md#4-setup-step-by-step) once on the presenting laptop.
2. Run `python manage.py seed_demo` and `python manage.py createsuperuser`.
3. Open VS Code in `django-seminar` with `items/models.py`, `items/views.py`, `items/urls.py` and `items/admin.py` ready in tabs.
4. Start the server and check <http://127.0.0.1:8000/api/items/> loads.

## Part 1. The API (CRUD)

1. **List (Read).** Open `/api/items/`. Point out the JSON list and the *GET* button.
2. **Create.** Scroll to the form at the bottom of the page, enter a name, price and quantity, click **POST**. Show the `201 Created` response.
3. **Read one.** Open `/api/items/<id>/` using the new item's id.
4. **Update.** On that page edit a value and click **PUT**.
5. **Delete.** Click **DELETE**, then reload `/api/items/` to show it is gone.
6. **Validation.** POST an item with an empty name. Show the `400 Bad Request` error JSON.

Say: *"Each of these is one URL in `urls.py`, one function in `views.py`, one serializer and the Item model."*

## Part 2. Follow the request through the code

Show the files in this order (about 1 minute each):

1. `config/urls.py`: `path("api/", include("items.urls"))`
2. `items/urls.py`: `path("items/<int:pk>/", views.item_detail)`
3. `items/views.py`: the `item_list` function
4. `items/serializers.py`: model to JSON
5. `items/models.py`: the `Item` class

## Part 3. ORM and migrations

In a second terminal (with the venv active):

```bash
python manage.py shell
```

```python
from items.models import Item
Item.objects.all()
Item.objects.filter(is_available=True).count()
Item.objects.create(name="Eraser", price="5.00", quantity=100)
Item.objects.order_by("-price").first()
```

Then show the SQL behind the model:

```bash
python manage.py sqlmigrate items 0001
python manage.py showmigrations
```

Optional live change: add `warranty_months = models.PositiveIntegerField(default=0)` to `Item`, run `makemigrations`, show the new file in `items/migrations/`, then run `migrate`. (Undo it afterwards with `git checkout items/` and delete the new migration file.)

## Part 4. Admin panel

1. Open <http://127.0.0.1:8000/admin/> and log in.
2. Open **Items**. Show: search box, filter sidebar, sortable columns, edit price in the list and click **Save**.
3. Use the **Action** dropdown: select items and run *Mark selected items as unavailable*.
4. In `items/admin.py` comment out `list_filter = ...`, reload the page, and show the sidebar disappear. Restore it.

## Part 4b. React frontend (2 minutes)

1. Second terminal: `cd frontend`, `npm install` (once), `npm run dev`.
2. Open <http://localhost:5173/>. The same items appear as cards.
3. Add an item in the admin and refresh the React page to show it updates.
4. Open `frontend/src/App.jsx` and point at the `fetch("/api/items/")` call.

## Part 5. Security quick demo (2 minutes)

1. In the browsable API form, create an item named `'; DROP TABLE items_item; --`. It is saved as plain text and the table is fine (the ORM sends values as parameters).
2. Run `python manage.py test` and show all tests passing, including the CSRF and SQL injection tests.

## If something goes wrong

| Problem | Quick fix |
| --- | --- |
| Port busy | `python manage.py runserver 8001` |
| `no such table` | `python manage.py migrate` |
| Messed up data | Stop the server, delete `db.sqlite3`, run `migrate` and `seed_demo` |
