"""
Dataset preparation pipeline for MailGuard email spam detection.

Downloads (if needed), inspects, validates, cleans, deduplicates,
and normalizes the large-scale multi-source email dataset:
'locuoco/the-biggest-spam-ham-phish-email-dataset-300000' (MIT License).

Output format:
- CSV at backend/data/prepared_emails.csv with columns:
  - label: 'ham' or 'spam' (binary target for classification)
  - original_label: 'ham', 'phish', or 'spam' (provenance tracking)
  - text: cleaned email text
- Metadata JSON at backend/data/dataset_metadata.json
"""

import argparse
import hashlib
import json
import os
import re
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Optional, Tuple

import pandas as pd
import requests

BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data"
EXTERNAL_DIR = DATA_DIR / "external"
DEFAULT_INPUT = EXTERNAL_DIR / "large_emails.csv"
DEFAULT_OUTPUT = DATA_DIR / "prepared_emails.csv"
METADATA_OUTPUT = DATA_DIR / "dataset_metadata.json"

HUGGINGFACE_DATASET_ID = "locuoco/the-biggest-spam-ham-phish-email-dataset-300000"
HUGGINGFACE_RAW_URL = (
    "https://huggingface.co/datasets/locuoco/the-biggest-spam-ham-phish-email-dataset-300000/resolve/main/df.csv"
)

RAW_LABEL_MAP: Dict[int, Tuple[str, str]] = {
    0: ("ham", "ham"),       # Raw label 0: Legitimate email -> binary 'ham'
    1: ("spam", "phish"),    # Raw label 1: Phishing -> binary 'spam' (unsolicited malicious)
    2: ("spam", "spam"),     # Raw label 2: Unsolicited spam -> binary 'spam'
}

WHITESPACE_REGEX = re.compile(r"[ \t]+")


def clean_text(text: str) -> str:
    """Normalize whitespace and strip leading/trailing spaces without deleting meaningful words."""
    if not isinstance(text, str):
        return ""
    text = text.strip()
    if not text:
        return ""
    # Collapse multiple spaces or tabs into a single space while keeping line breaks intact
    text = WHITESPACE_REGEX.sub(" ", text)
    # Collapse 3+ consecutive newlines into 2
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def download_dataset_if_missing(target_path: Path) -> None:
    """Download the dataset from Hugging Face if not already downloaded."""
    if target_path.exists() and target_path.stat().st_size > 10_000_000:
        print(f"Dataset already exists at: {target_path} ({target_path.stat().st_size / 1e6:.1f} MB)")
        return

    target_path.parent.mkdir(parents=True, exist_ok=True)
    temp_target = target_path.with_suffix(".download.tmp")

    print(f"Downloading dataset from {HUGGINGFACE_RAW_URL}...")
    headers = {"User-Agent": "MailGuard-ML-Pipeline/1.0"}

    try:
        with requests.get(HUGGINGFACE_RAW_URL, headers=headers, stream=True, timeout=120) as r:
            r.raise_for_status()
            total_size = int(r.headers.get("content-length", 0))
            downloaded = 0
            start_time = time.time()
            chunk_size = 1024 * 1024  # 1 MB

            with open(temp_target, "wb") as f:
                for chunk in r.iter_content(chunk_size=chunk_size):
                    if chunk:
                        f.write(chunk)
                        downloaded += len(chunk)
                        if total_size > 0:
                            pct = (downloaded / total_size) * 100
                            mb = downloaded / (1024 * 1024)
                            speed = mb / max(0.1, time.time() - start_time)
                            print(f"\rDownloaded {mb:.1f} MB ({pct:.1f}%) at {speed:.1f} MB/s", end="", flush=True)

        print("\nDownload complete. Finalizing file...")
        if temp_target.exists():
            if target_path.exists():
                target_path.unlink()
            temp_target.rename(target_path)
    except Exception as e:
        if temp_target.exists():
            temp_target.unlink()
        raise RuntimeError(f"Failed to download dataset: {e}") from e


def process_dataset(
    input_path: Path,
    output_path: Path,
    metadata_path: Path,
    sample_size: int = 80_000,
    chunk_size: int = 50_000,
    random_seed: int = 42,
) -> Dict:
    """
    Stream, validate, clean, deduplicate, and prepare emails from the large dataset.

    Args:
        input_path: Path to raw CSV.
        output_path: Destination path for prepared CSV.
        metadata_path: Destination path for metadata JSON.
        sample_size: Total balanced rows to sample (0 or negative means keep all deduplicated rows).
        chunk_size: Size of chunks for streaming.
        random_seed: Random state for deterministic sampling.
    """
    if not input_path.exists():
        raise FileNotFoundError(f"Input file not found at: {input_path}")

    print(f"Beginning dataset preparation from: {input_path}")
    print(f"Chunk size: {chunk_size:,} | Requested sample size: {'ALL' if sample_size <= 0 else f'{sample_size:,}'}")

    # Inspect first few rows for validation
    sample_df = pd.read_csv(input_path, nrows=5)
    expected_cols = {"label", "text"}
    if not expected_cols.issubset(sample_df.columns):
        raise ValueError(
            f"Input CSV missing required columns. Expected {expected_cols}, got {list(sample_df.columns)}"
        )

    # Metrics tracked
    total_raw_rows = 0
    missing_text_count = 0
    empty_after_clean_count = 0
    invalid_label_count = 0
    exact_duplicates_count = 0

    seen_text_hashes = set()
    cleaned_records = []

    start_time = time.time()

    for chunk_idx, chunk in enumerate(pd.read_csv(input_path, chunksize=chunk_size)):
        total_raw_rows += len(chunk)

        for _, row in chunk.iterrows():
            raw_label = row["label"]
            raw_text = row["text"]

            # Validate label
            try:
                raw_label_int = int(raw_label)
            except (ValueError, TypeError):
                invalid_label_count += 1
                continue

            if raw_label_int not in RAW_LABEL_MAP:
                invalid_label_count += 1
                continue

            binary_label, orig_label_name = RAW_LABEL_MAP[raw_label_int]

            # Validate & clean text
            if pd.isna(raw_text):
                missing_text_count += 1
                continue

            cleaned = clean_text(str(raw_text))
            # Require minimum length of 10 characters
            if len(cleaned) < 10:
                empty_after_clean_count += 1
                continue

            # Check duplicate via hash of lowercase stripped text
            norm_hash = hashlib.sha256(cleaned.lower().encode("utf-8", errors="ignore")).digest()
            if norm_hash in seen_text_hashes:
                exact_duplicates_count += 1
                continue

            seen_text_hashes.add(norm_hash)
            cleaned_records.append((binary_label, orig_label_name, cleaned))

        elapsed = time.time() - start_time
        print(
            f"Processed {total_raw_rows:,} raw rows... "
            f"Unique valid collected: {len(cleaned_records):,} ({elapsed:.1f}s)",
            end="\r",
            flush=True,
        )

    print()
    unique_count = len(cleaned_records)
    print(f"Total raw rows processed: {total_raw_rows:,}")
    print(f"Duplicates removed: {exact_duplicates_count:,}")
    print(f"Invalid / empty removed: {missing_text_count + empty_after_clean_count + invalid_label_count:,}")
    print(f"Total unique valid records: {unique_count:,}")

    df_clean = pd.DataFrame(cleaned_records, columns=["label", "original_label", "text"])
    orig_dist = df_clean["original_label"].value_counts().to_dict()
    binary_dist = df_clean["label"].value_counts().to_dict()

    print("\nUnique dataset distribution by original label:")
    for k, v in orig_dist.items():
        print(f"  - {k}: {v:,} ({v / unique_count * 100:.1f}%)")

    print("\nUnique dataset distribution by binary label (phish + spam -> spam):")
    for k, v in binary_dist.items():
        print(f"  - {k}: {v:,} ({v / unique_count * 100:.1f}%)")

    # Sample if requested
    if 0 < sample_size < len(df_clean):
        print(f"\nBalancing and sampling to {sample_size:,} records (random_state={random_seed})...")
        target_per_class = sample_size // 2

        ham_df = df_clean[df_clean["label"] == "ham"]
        spam_df = df_clean[df_clean["label"] == "spam"]

        ham_sample = ham_df.sample(n=min(target_per_class, len(ham_df)), random_state=random_seed)
        spam_sample = spam_df.sample(n=min(target_per_class, len(spam_df)), random_state=random_seed)

        df_final = (
            pd.concat([ham_sample, spam_sample], ignore_index=True)
            .sample(frac=1.0, random_state=random_seed)
            .reset_index(drop=True)
        )
    else:
        df_final = df_clean.sample(frac=1.0, random_state=random_seed).reset_index(drop=True)

    # Save prepared dataset
    output_path.parent.mkdir(parents=True, exist_ok=True)
    df_final.to_csv(output_path, index=False)
    output_size_mb = output_path.stat().st_size / (1024 * 1024)
    print(f"\nSaved prepared dataset to: {output_path} ({output_size_mb:.1f} MB)")
    print(f"Final prepared rows: {len(df_final):,}")
    print("Final class distribution:\n", df_final["label"].value_counts().to_string())

    # Metadata record
    metadata = {
        "dataset_name": "The Biggest Spam Ham Phish Email Dataset (250000+)",
        "huggingface_id": HUGGINGFACE_DATASET_ID,
        "source_url": HUGGINGFACE_RAW_URL,
        "original_provenance": "Kaggle: akshatsharma2/the-biggest-spam-ham-phish-email-dataset-300000",
        "license": "MIT",
        "date_prepared": datetime.now(timezone.utc).isoformat(),
        "raw_file_name": input_path.name,
        "raw_total_rows": total_raw_rows,
        "raw_label_definition": {
            "0": "ham (legitimate personal and business emails, Enron, meetings, schedules)",
            "1": "phish (unsolicited malicious credential/payment phishing)",
            "2": "spam (unsolicited commercial advertisements, prize scams)",
        },
        "binary_mapping_policy": {
            "ham (0)": "ham",
            "phish (1)": "spam (malicious unsolicited mail is classified as spam in binary detector)",
            "spam (2)": "spam",
        },
        "records_removed": {
            "exact_duplicates": exact_duplicates_count,
            "missing_or_short_text": missing_text_count + empty_after_clean_count,
            "invalid_labels": invalid_label_count,
        },
        "total_unique_records": unique_count,
        "unique_original_distribution": orig_dist,
        "unique_binary_distribution": binary_dist,
        "prepared_file": output_path.name,
        "prepared_rows": len(df_final),
        "prepared_label_distribution": df_final["label"].value_counts().to_dict(),
        "prepared_original_label_distribution": df_final["original_label"].value_counts().to_dict(),
        "random_seed": random_seed,
    }

    metadata_path.parent.mkdir(parents=True, exist_ok=True)
    with open(metadata_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    print(f"Saved dataset metadata to: {metadata_path}")
    return metadata


def main():
    parser = argparse.ArgumentParser(description="Prepare and clean MailGuard dataset.")
    parser.add_argument(
        "--input",
        type=Path,
        default=DEFAULT_INPUT,
        help="Path to raw CSV (default: backend/data/external/large_emails.csv)",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT,
        help="Path to save prepared CSV (default: backend/data/prepared_emails.csv)",
    )
    parser.add_argument(
        "--metadata",
        type=Path,
        default=METADATA_OUTPUT,
        help="Path to save metadata JSON (default: backend/data/dataset_metadata.json)",
    )
    parser.add_argument(
        "--sample-size",
        type=int,
        default=80_000,
        help="Target balanced sample size (default: 80,000; set 0 for all unique)",
    )
    parser.add_argument(
        "--download-if-missing",
        action="store_true",
        default=True,
        help="Automatically download raw dataset if not found",
    )
    args = parser.parse_args()

    if not args.input.exists() and args.download_if_missing:
        download_dataset_if_missing(args.input)

    process_dataset(
        input_path=args.input,
        output_path=args.output,
        metadata_path=args.metadata,
        sample_size=args.sample_size,
    )


if __name__ == "__main__":
    main()
