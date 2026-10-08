# GitHub basics for this seminar

You only need three things: **get the code**, **run it**, and (optionally) **keep it up to date**.

## What is GitHub?

- **Git** is a tool that keeps the history of a project's files.
- **GitHub** is a website that stores Git projects online (called *repositories*).
- A **repository** (repo) is just a project folder with its history. This repo is called `mca`, and our project lives in its `django-seminar` folder.

## 1. Get the code

### Easiest: download a ZIP (no Git needed)

1. Open the repository page on GitHub.
2. Click the green **Code** button.
3. Click **Download ZIP**.
4. Right-click the ZIP file and choose **Extract All**.
5. Open the extracted `mca/django-seminar` folder.

### Better: clone with Git

1. Install Git from <https://git-scm.com/downloads> (accept the default options).
2. Open a terminal (PowerShell on Windows) and run:

```bash
git clone https://github.com/MrNihalT/mca.git
cd mca/django-seminar
```

(Copy the real address from the green **Code** button on the repository page.)

## 2. Open the folder in VS Code

```bash
code .
```

Or: open VS Code and choose *File > Open Folder*, then pick `django-seminar`. Use *Terminal > New Terminal* to get a terminal already inside the folder.

## 3. Follow the setup

Go back to the [README](../README.md#4-setup-step-by-step) and follow *Setup: step by step*.

## 4. Get updates later (only if you cloned)

If the teacher updates the repo, bring the changes to your computer:

```bash
git pull
python manage.py migrate
```

If Git says you have local changes that conflict, copy your edited files somewhere safe, then ask for help.

## 5. Save your own experiments (optional)

Make your own copy first: click **Fork** on GitHub, then clone *your* fork. After editing files:

```bash
git status                 # what changed?
git add .                  # choose all changes
git commit -m "Describe what you changed"
git push                   # upload to your GitHub
```

## Words you will hear

| Word | Meaning |
| --- | --- |
| repository / repo | A project folder tracked by Git |
| clone | Copy a repo from GitHub to your computer |
| commit | A saved snapshot of your changes, with a message |
| push | Upload your commits to GitHub |
| pull | Download new commits from GitHub |
| fork | Your own copy of someone else's repo on GitHub |
| branch | A separate line of work (the default one is `main`) |
| `.gitignore` | A list of files Git should not track (for example `venv/` and `db.sqlite3`) |

## Why `venv/` and `db.sqlite3` are not in the repo

Every student creates their **own** virtual environment and database on their laptop, so these are listed in `.gitignore`. That is why the setup steps ask you to run `python -m venv venv` and `python manage.py migrate`.
