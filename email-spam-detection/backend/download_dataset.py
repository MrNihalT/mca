
from pathlib import Path
from io import BytesIO

import pandas as pd
import requests

# Paths
BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data"
OUTPUT = DATA_DIR / "emails.csv"

# Hugging Face Parquet API
API_URL = (
    "https://huggingface.co/api/datasets/"
    "talby/spamassassin/parquet"
)


def normalize_label(value):
    """
    Convert dataset labels into consistent categories.

    This dataset may use:
    0 = spam
    1 = ham (legitimate email)
    """
    value = str(value).strip().lower()

    label_map = {
        "0": "spam",
        "1": "ham",
        "spam": "spam",
        "ham": "ham",
        "junk": "spam",
        "legitimate": "ham",
        "not spam": "ham",
        "not_spam": "ham",
    }

    return label_map.get(value)


def main():
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    # Step 1: Discover available Parquet files
    print("Finding available dataset files...")

    response = requests.get(API_URL, timeout=30)
    response.raise_for_status()

    parquet_info = response.json()

    # Find the training split for the text configuration
    urls = parquet_info.get("text", {}).get("train", [])

    if not urls:
        raise RuntimeError(
            "No Parquet training file found. "
            f"Available configurations: {list(parquet_info.keys())}"
        )

    dataset_url = urls[0]

    # Step 2: Download the dataset
    print("Downloading SpamAssassin dataset...")

    file_response = requests.get(dataset_url, timeout=120)
    file_response.raise_for_status()

    # Step 3: Load Parquet into a DataFrame
    df = pd.read_parquet(BytesIO(file_response.content))

    print("Original columns:", df.columns.tolist())
    print("Original label distribution:")
    print(df["label"].value_counts(dropna=False))

    # Step 4: Keep required columns
    if not {"label", "text"}.issubset(df.columns):
        raise ValueError(
            "Dataset must contain 'label' and 'text' columns."
        )

    df = df[["label", "text"]].copy()

    # Step 5: Normalize labels
    df["label"] = df["label"].map(normalize_label)

    # Step 6: Clean message text
    df["text"] = (
        df["text"]
        .fillna("")
        .astype(str)
        .str.strip()
    )

    # Step 7: Remove invalid rows and duplicate emails
    df = df[df["label"].notna()]
    df = df[df["text"].str.len() > 0]
    df = df.drop_duplicates(subset=["text"])

    # Step 8: Validate the dataset
    if df.empty:
        raise ValueError(
            "No valid emails remain after cleaning. "
            "Check the dataset's label encoding."
        )

    if df["label"].nunique() != 2:
        raise ValueError(
            "Both spam and ham labels are required. "
            f"Found: {df['label'].unique().tolist()}"
        )

    # Step 9: Save the processed dataset
    df.to_csv(OUTPUT, index=False)

    print("\nDataset downloaded successfully!")
    print(f"Saved to: {OUTPUT}")
    print(f"Total emails: {len(df):,}")

    print("\nFinal class distribution:")
    print(df["label"].value_counts())

    print("\nFirst five rows:")
    print(df.head())


if __name__ == "__main__":
    main()
