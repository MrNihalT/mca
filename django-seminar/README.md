# Django Items API

A small Django + Django REST Framework project with an `Item` model, a JSON API and an admin panel.

## Requirements

- Python 3.10 or newer (`python --version` to check). Download: <https://www.python.org/downloads/> (on Windows tick **Add python.exe to PATH**)
- Git (optional, `git --version` to check)

## 1. Get the code

With Git:

```bash
git clone https://github.com/MrNihalT/mca.git
cd mca/django-seminar
```

Without Git: open <https://github.com/MrNihalT/mca>, click **Code > Download ZIP**, extract it, and open the `django-seminar` folder in a terminal.

Run every command below inside this folder (the one that contains `manage.py`).

## 2. Setup

**Create a virtual environment**

```bash
python -m venv venv
```

**Activate it**

Windows (PowerShell):

```bash
venv\Scripts\Activate.ps1
```

Windows (Command Prompt):

```bash
venv\Scripts\activate.bat
```

Mac / Linux:

```bash
source venv/bin/activate
```

`(venv)` should now appear at the start of the prompt.

**Install the requirements**

```bash
pip install -r requirements.txt
```

**Create the database tables**

```bash
python manage.py migrate
```

**Add sample data (optional)**

```bash
python manage.py seed_demo
```

**Create an admin user**

```bash
python manage.py createsuperuser
```

Enter a username and password (the password is not shown while typing).

## 3. Run

```bash
python manage.py runserver
```

Then open:

| Address | What it is |
| --- | --- |
| <http://127.0.0.1:8000/api/items/> | List and create items |
| <http://127.0.0.1:8000/api/items/1/> | View, update or delete one item |
| <http://127.0.0.1:8000/admin/> | Admin panel (log in with the user you created) |

Stop the server with `Ctrl + C`.

To run the tests:

```bash
python manage.py test
```

## 4. Run the React frontend

A small React page (in the `frontend` folder) shows the items from the API.

**Requirement:** Node.js 18 or newer (`node --version` to check). Download: <https://nodejs.org/>

Keep the Django server from step 3 running, then open a **second terminal** in the `django-seminar` folder:

```bash
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173/> in your browser. The page loads the items from `http://127.0.0.1:8000/api/items/` (the dev server forwards `/api` requests to Django, so no extra setup is needed).

Stop it with `Ctrl + C`. If you see "Could not load items", make sure the Django server is running.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| `python` is not recognised | Reinstall Python with *Add to PATH* ticked, or try `py` (Windows) / `python3` (Mac, Linux) |
| PowerShell says running scripts is disabled | Run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`, then activate again (or use Command Prompt) |
| `No module named django` | The virtual environment is not active. Activate it and run `pip install -r requirements.txt` |
| `no such table: items_item` | Run `python manage.py migrate` |
| Port already in use | Run `python manage.py runserver 8001` |
| Start again with a fresh database | Stop the server, delete `db.sqlite3`, run `python manage.py migrate` |
