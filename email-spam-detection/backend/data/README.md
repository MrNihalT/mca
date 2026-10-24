Put the generated `emails.csv` dataset here. The downloader creates it automatically.

Expected CSV format:
- `label`: `spam` or `ham`
- `text`: full email text

Run `python download_dataset.py` from the backend directory to fetch and prepare the SpamAssassin public corpus dataset.
Do not commit datasets containing personal or confidential emails.
