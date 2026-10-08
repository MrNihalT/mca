"""
tests.py - run with:  python manage.py test
Django creates a temporary empty database for the tests and deletes it after.
"""

from django.test import Client, TestCase

from .models import Item


class ItemModelTests(TestCase):
    def test_str_returns_name(self):
        self.assertEqual(str(Item(name="Pen")), "Pen")


class ItemApiTests(TestCase):
    def test_create_read_update_delete(self):
        # CREATE
        response = self.client.post("/api/items/", {"name": "Pen", "price": "10.50", "quantity": 5})
        self.assertEqual(response.status_code, 201)
        item = Item.objects.get()
        self.assertEqual(item.name, "Pen")

        # READ (list and detail)
        self.assertContains(self.client.get("/api/items/"), "Pen")
        self.assertEqual(self.client.get(f"/api/items/{item.pk}/").json()["price"], "10.50")

        # UPDATE
        response = self.client.put(
            f"/api/items/{item.pk}/", {"name": "Gel pen", "price": "12.00", "quantity": 5}, content_type="application/json"
        )
        self.assertEqual(response.status_code, 200)
        item.refresh_from_db()
        self.assertEqual(item.name, "Gel pen")

        # DELETE
        self.assertEqual(self.client.delete(f"/api/items/{item.pk}/").status_code, 204)
        self.assertEqual(Item.objects.count(), 0)

    def test_validation_error(self):
        response = self.client.post("/api/items/", {"name": "No price"})
        self.assertEqual(response.status_code, 400)

    def test_missing_item_is_404(self):
        self.assertEqual(self.client.get("/api/items/999/").status_code, 404)



class SecurityTests(TestCase):
    def test_sql_injection_string_is_just_text(self):
        """The ORM sends values as parameters, so SQL in the input is stored as plain text."""
        attack = "'; DROP TABLE items_item; --"
        response = self.client.post("/api/items/", {"name": attack, "price": "1"})
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Item.objects.get().name, attack)  # the table still exists

    def test_csrf_is_enforced_on_forms(self):
        """A POST without the CSRF token is rejected (admin login form)."""
        strict = Client(enforce_csrf_checks=True)
        response = strict.post("/admin/login/", {"username": "x", "password": "y"})
        self.assertEqual(response.status_code, 403)
