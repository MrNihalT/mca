"""
MailGuard Model Training & Evaluation Pipeline.

Trains, evaluates, and selects text classification models (MultinomialNB vs Logistic Regression)
using word and character TF-IDF feature unions. Prevents data leakage with strict Train/Validation/Test
splits and includes a dedicated transactional email evaluation suite.
"""

import json
import os
import shutil
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Tuple

import joblib
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)
from sklearn.model_selection import train_test_split
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import FeatureUnion, Pipeline

BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data"
PREPARED_DATA_PATH = DATA_DIR / "prepared_emails.csv"
FALLBACK_DATA_PATH = DATA_DIR / "emails.csv"
METADATA_PATH = DATA_DIR / "dataset_metadata.json"
MODEL_DIR = BASE_DIR / "models"
MODEL_PATH = MODEL_DIR / "spam_model.joblib"
METRICS_PATH = BASE_DIR / "metrics.json"

RANDOM_STATE = 42

# --- Dedicated Transactional Ham Evaluation Suite (Held out, NEVER added to training data) ---
TRANSACTIONAL_HAM_EVALUATION = [
    {
        "id": "appt_wednesday_reception",
        "description": "Appointment Confirmation with reception and rescheduling instructions (previously failing)",
        "text": (
            "Subject: Appointment Confirmation for Wednesday\n\n"
            "Hello,\n\n"
            "This email confirms your appointment for Wednesday, October 28, at 3:00 PM. "
            "Please arrive a few minutes early. If you need to reschedule, contact our "
            "reception team during normal working hours.\n\n"
            "We look forward to seeing you.\n\n"
            "Regards,\nReception"
        ),
    },
    {
        "id": "dental_clinic_reminder",
        "description": "Dental clinic checkup and cleaning reminder",
        "text": (
            "Subject: Dental Checkup Reminder - Tomorrow at 10 AM\n\n"
            "Dear Patient, this is a reminder for your upcoming hygiene and cleaning "
            "appointment with Dr. Miller tomorrow at 10:00 AM. Please call our clinic "
            "if you need to reschedule or have any questions."
        ),
    },
    {
        "id": "ecommerce_order_receipt",
        "description": "E-commerce order confirmation and purchase receipt with dollar amounts",
        "text": (
            "Subject: Order Confirmation #8492041\n\n"
            "Thank you for your purchase. We have received your order for the items listed below. "
            "Your order total is $42.50 charged to your Visa ending in 4102. You will receive tracking "
            "information once your package departs our fulfillment center."
        ),
    },
    {
        "id": "shipping_tracking_update",
        "description": "Package delivery tracking update with carrier and estimated time",
        "text": (
            "Subject: Your package has shipped! Tracking #94001118992\n\n"
            "Your shipment is in transit. Estimated delivery date: Thursday by 7:00 PM. "
            "Track package progress through your verified account dashboard."
        ),
    },
    {
        "id": "flight_itinerary_confirmation",
        "description": "Airline booking confirmation with itinerary details",
        "text": (
            "Subject: Flight Itinerary - Booking Reference: ABC123\n\n"
            "Your flight from San Francisco (SFO) to New York (JFK) is confirmed. "
            "Departure: Nov 14 at 8:30 AM. Terminal 2, Gate 42. Please check in online "
            "24 hours prior to departure."
        ),
    },
    {
        "id": "team_meeting_invitation",
        "description": "Calendar invitation and agenda for sprint planning",
        "text": (
            "Subject: Sprint Planning Meeting - Thursday 2 PM\n\n"
            "Hi team,\n\n"
            "Our bi-weekly sprint planning session is scheduled for Thursday from 2:00 PM to 3:30 PM. "
            "Please review the backlog and add any discussion points to the shared document before we meet.\n\n"
            "Thanks,\nSarah"
        ),
    },
    {
        "id": "university_announcement",
        "description": "University academic seminar announcement",
        "text": (
            "Subject: Department Lecture: Deep Learning in Healthcare\n\n"
            "Dear students and faculty, You are invited to attend a guest lecture by Dr. Alan Walker "
            "this Friday at 4:00 PM in the Science Auditorium. Refreshments will be served after the Q&A."
        ),
    },
    {
        "id": "saas_invoice_receipt",
        "description": "SaaS monthly subscription receipt",
        "text": (
            "Subject: Your receipt for Cloud Hosting Services (Invoice #INV-2026-10)\n\n"
            "Dear Customer, Your monthly subscription for Cloud Starter Plan has successfully renewed for $29.00. "
            "Your invoice receipt is attached for your accounting records. Thank you for your continued business."
        ),
    },
    {
        "id": "legitimate_password_reset",
        "description": "Legitimate password reset notification",
        "text": (
            "Subject: Password Reset Request for your Account\n\n"
            "We received a request to reset your account password. If you initiated this request, "
            "please use the button below to proceed. If you did not make this request, your account "
            "is safe and you can disregard this email."
        ),
    },
    {
        "id": "bank_statement_ready",
        "description": "Monthly bank account statement notification",
        "text": (
            "Subject: Your Monthly Account Statement is Ready to View\n\n"
            "Dear Customer, Your checking account statement for September is now available in Online Banking. "
            "Sign in to your verified mobile app or online banking portal to review your balance and transactions."
        ),
    },
]

# --- Dedicated Modern Spam Evaluation Suite (Held out, NEVER added to training data) ---
DEDICATED_SPAM_EVALUATION = [
    {
        "id": "lottery_prize_scam",
        "description": "International lottery cash prize scam asking for fee",
        "text": (
            "Subject: CONGRATULATIONS! YOU HAVE WON $5,000,000 IN CASH\n\n"
            "Dear Winner, your email was selected in our international balloting sweepstakes. "
            "To claim your five million dollar prize payout, reply with your full bank account details "
            "and wire a $250 release fee immediately."
        ),
    },
    {
        "id": "urgent_bank_phish",
        "description": "Urgent bank account suspension phishing link",
        "text": (
            "Subject: URGENT: Your Bank Account Access Has Been Suspended\n\n"
            "Security Alert: Unauthorized login attempts were detected on your online profile. "
            "Your debit card is frozen. Click this link immediately and enter your social security number, "
            "password, and PIN to restore access."
        ),
    },
    {
        "id": "crypto_doubling_fraud",
        "description": "Cryptocurrency doubling scam",
        "text": (
            "Subject: Double your Bitcoin in 24 Hours Guaranteed!\n\n"
            "Limited promo: Send between 0.1 BTC and 2 BTC to our automated smart contract address "
            "and receive double your coins back within 24 hours. Don't miss out on this financial opportunity!"
        ),
    },
    {
        "id": "advance_fee_inheritance",
        "description": "Barrister foreign diplomat inheritance proposal",
        "text": (
            "Subject: CONFIDENTIAL BUSINESS PROPOSAL - $18.5M INHERITANCE\n\n"
            "I am barrister James Williams. A deceased foreign diplomat left $18,500,000 with no next of kin. "
            "I request your partnership to claim these funds. You will receive 40% of the total sum. "
            "Reply with your phone number and bank details."
        ),
    },
    {
        "id": "fake_urgent_invoice_malware",
        "description": "Fake overdue invoice threat with malicious attachment request",
        "text": (
            "Subject: OVERDUE INVOICE #98231 - PAY IMMEDIATELY\n\n"
            "Final notice before legal collection: Your overdue balance of $3,450.00 is unpaid. "
            "Open the attached macro-enabled zip file and send immediate wire payment to avoid court proceedings."
        ),
    },
]


def load_dataset() -> Tuple[pd.DataFrame, str]:
    """Load the prepared dataset if available, or fall back to emails.csv."""
    if PREPARED_DATA_PATH.exists():
        data_file = PREPARED_DATA_PATH
        source_desc = f"Prepared multi-source dataset ({PREPARED_DATA_PATH.name})"
    elif FALLBACK_DATA_PATH.exists():
        data_file = FALLBACK_DATA_PATH
        source_desc = f"Fallback SpamAssassin dataset ({FALLBACK_DATA_PATH.name})"
    else:
        raise FileNotFoundError(
            f"No dataset found at {PREPARED_DATA_PATH} or {FALLBACK_DATA_PATH}. "
            "Run `python prepare_dataset.py` first."
        )

    print(f"Loading dataset from: {data_file}")
    df = pd.read_csv(data_file)
    required = {"label", "text"}
    if not required.issubset(df.columns):
        raise ValueError(f"Dataset must have columns {required}; found {list(df.columns)}")

    df = df[["label", "text"]].copy()
    df["label"] = df["label"].astype(str).str.strip().str.lower()
    df["text"] = df["text"].fillna("").astype(str).str.strip()
    df = df[df["label"].isin(["spam", "ham"])]
    df = df[df["text"].str.len() > 0]
    df = df.drop_duplicates(subset=["label", "text"]).reset_index(drop=True)

    if df["label"].nunique() != 2:
        raise ValueError(f"Expected both 'spam' and 'ham' labels; found {df['label'].value_counts().to_dict()}")

    return df, source_desc


def build_pipeline(classifier) -> Pipeline:
    """Build a Scikit-Learn Pipeline combining word and char TF-IDF feature unions with a classifier."""
    features = FeatureUnion([
        (
            "word",
            TfidfVectorizer(
                lowercase=True,
                strip_accents="unicode",
                ngram_range=(1, 2),
                min_df=3,
                max_features=40_000,
                sublinear_tf=True,
            ),
        ),
        (
            "char",
            TfidfVectorizer(
                analyzer="char_wb",
                ngram_range=(3, 5),
                min_df=5,
                max_features=40_000,
                sublinear_tf=True,
            ),
        ),
    ])

    return Pipeline([
        ("features", features),
        ("classifier", classifier),
    ])


def evaluate_split(model, texts: pd.Series, labels: pd.Series, threshold: float = 0.50) -> Dict:
    """Compute detailed evaluation metrics on a partition."""
    if hasattr(model, "predict_proba"):
        classes = list(model.classes_)
        spam_idx = classes.index("spam")
        probs = model.predict_proba(texts)[:, spam_idx]
        predictions = np.where(probs >= threshold, "spam", "ham")
    else:
        predictions = model.predict(texts)

    cm = confusion_matrix(labels, predictions, labels=["ham", "spam"])
    tn, fp, fn, tp = cm.ravel()
    total_ham = tn + fp
    total_spam = fn + tp

    fpr = round(float(fp / total_ham), 4) if total_ham > 0 else 0.0
    fnr = round(float(fn / total_spam), 4) if total_spam > 0 else 0.0

    return {
        "accuracy": round(float(accuracy_score(labels, predictions)), 4),
        "precision_spam": round(
            float(precision_score(labels, predictions, pos_label="spam", zero_division=0)), 4
        ),
        "recall_spam": round(
            float(recall_score(labels, predictions, pos_label="spam", zero_division=0)), 4
        ),
        "f1_spam": round(
            float(f1_score(labels, predictions, pos_label="spam", zero_division=0)), 4
        ),
        "precision_ham": round(
            float(precision_score(labels, predictions, pos_label="ham", zero_division=0)), 4
        ),
        "recall_ham": round(
            float(recall_score(labels, predictions, pos_label="ham", zero_division=0)), 4
        ),
        "f1_ham": round(
            float(f1_score(labels, predictions, pos_label="ham", zero_division=0)), 4
        ),
        "false_positive_rate": fpr,
        "false_negative_rate": fnr,
        "false_positives": int(fp),
        "false_negatives": int(fn),
        "true_positives": int(tp),
        "true_negatives": int(tn),
        "confusion_matrix_labels_ham_spam": cm.tolist(),
        "classification_report": classification_report(
            labels, predictions, labels=["ham", "spam"], output_dict=True, zero_division=0
        ),
    }


def evaluate_dedicated_suite(model, suite: List[Dict], expected_label: str) -> List[Dict]:
    """Evaluate a model on a dedicated collection of realistic messages."""
    classes = list(model.classes_)
    spam_idx = classes.index("spam")
    results = []

    for item in suite:
        text = item["text"]
        pred = str(model.predict([text])[0])
        spam_prob = None
        if hasattr(model, "predict_proba"):
            spam_prob = round(float(model.predict_proba([text])[0][spam_idx]), 4)

        passed = (pred == expected_label)
        results.append({
            "id": item["id"],
            "description": item["description"],
            "expected": expected_label,
            "predicted": pred,
            "spam_probability": spam_prob,
            "passed": passed,
        })

    return results


def save_artifact_safely(obj, target_path: Path) -> None:
    """Save an object atomically using a temporary file and create a backup if existing."""
    target_path.parent.mkdir(parents=True, exist_ok=True)
    temp_path = target_path.with_suffix(".tmp")
    bak_path = target_path.with_suffix(".bak")

    # Save to temp
    joblib.dump(obj, temp_path, compress=3)

    # Backup existing
    if target_path.exists():
        shutil.copyfile(target_path, bak_path)

    # Atomic rename
    temp_path.replace(target_path)


def main():
    print("=" * 70)
    print("MailGuard Model Training & Multi-Metric Evaluation")
    print("=" * 70)

    # 1. Load Data
    df, source_desc = load_dataset()
    print(f"Loaded dataset: {len(df):,} emails")
    print(f"Class distribution:\n{df['label'].value_counts().to_string()}\n")

    # 2. Strict Partitioning (70% Train, 15% Validation, 15% Test)
    # Stratified by label to maintain balanced distribution in every split
    train_val, test = train_test_split(
        df, test_size=0.15, random_state=RANDOM_STATE, stratify=df["label"]
    )
    # 0.17647 of 85% is ~15% of total
    train, val = train_test_split(
        train_val, test_size=0.17647, random_state=RANDOM_STATE, stratify=train_val["label"]
    )

    print("Partition sizes:")
    print(f"  - Training split:   {len(train):,} emails ({len(train)/len(df)*100:.1f}%)")
    print(f"  - Validation split: {len(val):,} emails ({len(val)/len(df)*100:.1f}%)")
    print(f"  - Final Test split: {len(test):,} emails ({len(test)/len(df)*100:.1f}%)")

    # 3. Define Candidate Models
    candidate_configs = {
        "Multinomial Naive Bayes (alpha=0.1)": MultinomialNB(alpha=0.1),
        "Multinomial Naive Bayes (alpha=0.5)": MultinomialNB(alpha=0.5),
        "Logistic Regression (C=1.0)": LogisticRegression(
            C=1.0, max_iter=1500, class_weight="balanced", random_state=RANDOM_STATE
        ),
        "Logistic Regression (C=2.0)": LogisticRegression(
            C=2.0, max_iter=1500, class_weight="balanced", random_state=RANDOM_STATE
        ),
    }

    validation_results = {}
    fitted_pipelines = {}

    print("\n" + "-" * 70)
    print("Training candidate pipelines (fit ONLY on Training partition)...")
    print("-" * 70)

    for name, clf in candidate_configs.items():
        t0 = time.time()
        pipeline = build_pipeline(clf)
        pipeline.fit(train["text"], train["label"])
        elapsed = time.time() - t0

        val_metrics = evaluate_split(pipeline, val["text"], val["label"])
        validation_results[name] = val_metrics
        fitted_pipelines[name] = pipeline

        print(f"\n{name} (trained in {elapsed:.1f}s):")
        print(f"  Accuracy: {val_metrics['accuracy']:.4f} | Spam F1: {val_metrics['f1_spam']:.4f}")
        print(f"  Spam Precision: {val_metrics['precision_spam']:.4f} | Spam Recall: {val_metrics['recall_spam']:.4f}")
        print(f"  Ham Recall: {val_metrics['recall_ham']:.4f} | False Positive Rate (ham->spam): {val_metrics['false_positive_rate']*100:.2f}% ({val_metrics['false_positives']} FPs)")

    # 4. Model Selection on Validation Partition
    # Select candidate maximizing spam F1 with lowest false positive rate
    best_name = max(
        validation_results.keys(),
        key=lambda k: (validation_results[k]["f1_spam"], -validation_results[k]["false_positive_rate"])
    )
    chosen_pipeline = fitted_pipelines[best_name]

    print("\n" + "=" * 70)
    print(f"Selected Best Model: {best_name}")
    print(f"Validation Spam F1: {validation_results[best_name]['f1_spam']:.4f}")
    print(f"Validation FPR:     {validation_results[best_name]['false_positive_rate']*100:.2f}%")
    print("=" * 70)

    # 5. Threshold Analysis on Validation Partition
    print("\nAnalyzing classification threshold trade-offs on Validation data...")
    threshold_tradeoffs = {}
    classes = list(chosen_pipeline.classes_)
    spam_idx = classes.index("spam")
    val_probs = chosen_pipeline.predict_proba(val["text"])[:, spam_idx]

    for thresh in [0.40, 0.45, 0.50, 0.55, 0.60, 0.65]:
        t_metrics = evaluate_split(chosen_pipeline, val["text"], val["label"], threshold=thresh)
        threshold_tradeoffs[str(thresh)] = {
            "precision_spam": t_metrics["precision_spam"],
            "recall_spam": t_metrics["recall_spam"],
            "f1_spam": t_metrics["f1_spam"],
            "false_positive_rate": t_metrics["false_positive_rate"],
            "false_positives": t_metrics["false_positives"],
            "false_negatives": t_metrics["false_negatives"],
        }
        print(f"  Thresh {thresh:.2f} -> Prec: {t_metrics['precision_spam']:.4f} | Rec: {t_metrics['recall_spam']:.4f} | F1: {t_metrics['f1_spam']:.4f} | FPR: {t_metrics['false_positive_rate']*100:.2f}% ({t_metrics['false_positives']} FPs)")

    # 6. Evaluate Final Model ONCE on the Held-Out Test Set
    print("\n" + "-" * 70)
    print("Evaluating Selected Model on Untouched Held-Out Test Set...")
    print("-" * 70)
    test_metrics = evaluate_split(chosen_pipeline, test["text"], test["label"])
    print(f"Test Accuracy:       {test_metrics['accuracy']:.4f}")
    print(f"Test Spam Precision: {test_metrics['precision_spam']:.4f}")
    print(f"Test Spam Recall:    {test_metrics['recall_spam']:.4f}")
    print(f"Test Spam F1-Score:  {test_metrics['f1_spam']:.4f}")
    print(f"Test Ham F1-Score:   {test_metrics['f1_ham']:.4f}")
    print(f"Test False Positives:{test_metrics['false_positives']} (FPR: {test_metrics['false_positive_rate']*100:.2f}%)")
    print(f"Test False Negatives:{test_metrics['false_negatives']} (FNR: {test_metrics['false_negative_rate']*100:.2f}%)")

    # 7. Evaluate Dedicated Transactional Ham Suite
    print("\n" + "-" * 70)
    print("Evaluating Dedicated Transactional Ham Suite (10 Real-World Cases)...")
    print("-" * 70)
    ham_suite_results = evaluate_dedicated_suite(chosen_pipeline, TRANSACTIONAL_HAM_EVALUATION, expected_label="ham")
    passed_ham = sum(1 for r in ham_suite_results if r["passed"])
    print(f"Transactional Ham Results: {passed_ham}/{len(ham_suite_results)} Passed")
    for r in ham_suite_results:
        status = "PASSED" if r["passed"] else "FAILED"
        print(f"  [{status}] {r['id']}: pred={r['predicted']}, spam_prob={r['spam_probability']*100:.1f}% ({r['description']})")

    # 8. Evaluate Dedicated Modern Spam Suite
    print("\n" + "-" * 70)
    print("Evaluating Dedicated Modern Spam Suite (5 Real-World Scams)...")
    print("-" * 70)
    spam_suite_results = evaluate_dedicated_suite(chosen_pipeline, DEDICATED_SPAM_EVALUATION, expected_label="spam")
    passed_spam = sum(1 for r in spam_suite_results if r["passed"])
    print(f"Spam Suite Results: {passed_spam}/{len(spam_suite_results)} Passed")
    for r in spam_suite_results:
        status = "PASSED" if r["passed"] else "FAILED"
        print(f"  [{status}] {r['id']}: pred={r['predicted']}, spam_prob={r['spam_probability']*100:.1f}% ({r['description']})")

    # 9. External Cross-Dataset Benchmark (SpamAssassin emails.csv)
    external_benchmark = None
    if FALLBACK_DATA_PATH.exists() and PREPARED_DATA_PATH.exists():
        print("\n" + "-" * 70)
        print("Evaluating on External Independent Dataset (SpamAssassin emails.csv)...")
        print("-" * 70)
        df_ext = pd.read_csv(FALLBACK_DATA_PATH)
        df_ext = df_ext.dropna(subset=["label", "text"])
        ext_metrics = evaluate_split(chosen_pipeline, df_ext["text"], df_ext["label"])
        print(f"External Benchmark Accuracy: {ext_metrics['accuracy']:.4f}")
        print(f"External Spam Precision:     {ext_metrics['precision_spam']:.4f}")
        print(f"External Spam Recall:        {ext_metrics['recall_spam']:.4f}")
        print(f"External Spam F1:            {ext_metrics['f1_spam']:.4f}")
        external_benchmark = {
            "dataset": FALLBACK_DATA_PATH.name,
            "total_emails": len(df_ext),
            "label_distribution": df_ext["label"].value_counts().to_dict(),
            "metrics": ext_metrics,
        }

    # 10. Save Artifacts Safely
    print("\nSaving final model artifact safely...")
    save_artifact_safely(chosen_pipeline, MODEL_PATH)
    model_size_mb = MODEL_PATH.stat().st_size / (1024 * 1024)
    print(f"Saved model to: {MODEL_PATH} ({model_size_mb:.2f} MB)")

    # Read dataset metadata if available
    metadata_info = {}
    if METADATA_PATH.exists():
        try:
            with open(METADATA_PATH, "r", encoding="utf-8") as f:
                metadata_info = json.load(f)
        except Exception:
            pass

    metrics_output = {
        "date_trained": datetime.now(timezone.utc).isoformat(),
        "selected_model": best_name,
        "dataset_source": source_desc,
        "dataset_metadata": metadata_info,
        "dataset_total_rows": len(df),
        "split_summary": {
            "train_rows": len(train),
            "validation_rows": len(val),
            "test_rows": len(test),
            "random_seed": RANDOM_STATE,
            "train_label_distribution": train["label"].value_counts().to_dict(),
            "val_label_distribution": val["label"].value_counts().to_dict(),
            "test_label_distribution": test["label"].value_counts().to_dict(),
        },
        "model_architecture": {
            "feature_pipeline": "FeatureUnion(word_tfidf(ngram=(1,2), max_features=40000), char_tfidf(analyzer=char_wb, ngram=(3,5), max_features=40000))",
            "classifier": best_name,
            "model_size_mb": round(model_size_mb, 2),
        },
        "validation_model_comparison": validation_results,
        "validation_threshold_tradeoffs": threshold_tradeoffs,
        "final_held_out_test_metrics": test_metrics,
        "dedicated_transactional_ham_evaluation": {
            "total": len(ham_suite_results),
            "passed": passed_ham,
            "pass_rate": round(passed_ham / len(ham_suite_results), 4),
            "cases": ham_suite_results,
        },
        "dedicated_spam_evaluation": {
            "total": len(spam_suite_results),
            "passed": passed_spam,
            "pass_rate": round(passed_spam / len(spam_suite_results), 4),
            "cases": spam_suite_results,
        },
        "external_benchmark_spamassassin": external_benchmark,
        "reproducibility_notes": (
            "Models were trained using Python scikit-learn on backend/data/prepared_emails.csv. "
            "Feature extraction was fit strictly on the training partition. "
            "Validation was used exclusively for model comparison and threshold analysis. "
            "Test metrics were evaluated once on the final untouched test partition."
        ),
    }

    temp_metrics = METRICS_PATH.with_suffix(".tmp")
    with open(temp_metrics, "w", encoding="utf-8") as f:
        json.dump(metrics_output, f, indent=2)
    temp_metrics.replace(METRICS_PATH)
    print(f"Saved comprehensive metrics to: {METRICS_PATH}")
    print("\nTraining and evaluation pipeline completed successfully!")


if __name__ == "__main__":
    main()
