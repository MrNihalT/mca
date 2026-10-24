
from pathlib import Path
import json

import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.pipeline import Pipeline, FeatureUnion
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    precision_score,
    recall_score,
    f1_score,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline


BASE_DIR = Path(__file__).parent
DATA_PATH = BASE_DIR / "data" / "emails.csv"
MODEL_PATH = BASE_DIR / "models" / "spam_model.joblib"
METRICS_PATH = BASE_DIR / "metrics.json"
RANDOM_STATE = 42


# Starter examples written for augmentation.
# Review them and expand with diverse, verified examples over time.
# Labels: spam = unsolicited/fraudulent email; ham = legitimate email.
EXTRA_EMAILS = [
    ("spam", "Congratulations! You won a lottery prize. Pay a processing fee to claim your reward."),
    ("spam", "Your lucky number has won a cash award. Send an advance payment before collection."),
    ("spam", "You have been selected for a prize draw you never entered. Pay a release charge now."),
    ("spam", "Claim your unexpected lottery winnings by paying a transfer fee today."),
    ("spam", "Your prize money is waiting. Provide your bank password to release the funds."),
    ("spam", "Urgent: pay a small delivery fee to receive your unclaimed prize."),
    ("spam", "A foreign lottery has selected your email address. Send your personal details to claim."),
    ("spam", "You are guaranteed a large cash reward. Pay taxes upfront to unlock your winnings."),
    ("spam", "Your account will be closed unless you verify your password at this link immediately."),
    ("spam", "We detected suspicious activity. Click this unverified link and enter your login details."),
    ("spam", "Your package is on hold. Pay this unexpected fee using the link below."),
    ("spam", "Act now to receive free money. Send your bank details to confirm your identity."),
    ("spam", "You have inherited a large fortune. Pay legal charges before the funds can be transferred."),
    ("spam", "Limited time offer: send payment now and receive ten times your money tomorrow."),
    ("spam", "Your email won a brand new phone. Pay the prize registration fee to continue."),
    ("spam", "We need your one-time password to stop an alleged unauthorized transaction."),
    ("spam", "Your subscription payment failed. Verify your card details at this unfamiliar website."),
    ("spam", "Claim your cash gift today. This offer is secret and you must act immediately."),
    ("ham", "Your order has shipped. You can view the tracking details in your account."),
    ("ham", "The team meeting is scheduled for Tuesday at 10 AM. Please review the agenda."),
    ("ham", "Your monthly bank statement is available through the bank's official application."),
    ("ham", "Thanks for attending the event. The slides are attached for your reference."),
    ("ham", "Your appointment is confirmed for tomorrow afternoon. Contact the clinic to reschedule."),
    ("ham", "The newsletter you subscribed to is ready. Unsubscribe using the link in its footer."),
    ("ham", "Your password reset was requested. If this was not you, visit the service's official website."),
    ("ham", "Your online purchase receipt is attached. The order total and items are listed below."),
    ("ham", "The university seminar begins at 9 AM in the main auditorium."),
    ("ham", "Your delivery is arriving today. Check the tracking page in the retailer's official app."),
    ("ham", "Our spring sale starts Friday. Visit our store if you are interested in the advertised offers."),
    ("ham", "Here are the notes from yesterday's project review and the tasks assigned to each person."),
]


def load_original_data():
    if not DATA_PATH.exists():
        raise FileNotFoundError(f"Dataset not found: {DATA_PATH}")

    df = pd.read_csv(DATA_PATH)

    required = {"label", "text"}
    if not required.issubset(df.columns):
        raise ValueError(
            f"Expected CSV columns {required}; found {list(df.columns)}"
        )

    df = df[["label", "text"]].copy()
    df["label"] = df["label"].astype(str).str.strip().str.lower()
    df["text"] = df["text"].fillna("").astype(str).str.strip()

    df = df[df["label"].isin(["spam", "ham"])]
    df = df[df["text"].str.len() > 0]
    df = df.drop_duplicates(subset=["label", "text"]).reset_index(drop=True)

    if df["label"].nunique() != 2:
        raise ValueError(
            "Dataset must contain both 'spam' and 'ham' labels. "
            f"Found: {df['label'].value_counts().to_dict()}"
        )

    return df


def make_model():
    features = FeatureUnion([
        ("word", TfidfVectorizer(
            lowercase=True,
            strip_accents="unicode",
            ngram_range=(1, 2),
            min_df=2,
            max_features=100_000,
            sublinear_tf=True,
        )),
        ("char", TfidfVectorizer(
            analyzer="char_wb",
            ngram_range=(3, 5),
            min_df=2,
            max_features=100_000,
            sublinear_tf=True,
        )),
    ])

    return Pipeline([
        ("features", features),
        ("classifier", LogisticRegression(
            C=2.0,
            max_iter=2000,
            class_weight="balanced",
            random_state=RANDOM_STATE,
        )),
    ])


def evaluate(model, texts, labels):
    predictions = model.predict(texts)
    return {
        "accuracy": round(float(accuracy_score(labels, predictions)), 4),
        "precision_spam": round(float(
            precision_score(labels, predictions, pos_label="spam", zero_division=0)
        ), 4),
        "recall_spam": round(float(
            recall_score(labels, predictions, pos_label="spam", zero_division=0)
        ), 4),
        "f1_spam": round(float(
            f1_score(labels, predictions, pos_label="spam", zero_division=0)
        ), 4),
        "classification_report": classification_report(
            labels, predictions, labels=["ham", "spam"], output_dict=True,
            zero_division=0
        ),
        "confusion_matrix_labels_ham_spam": confusion_matrix(
            labels, predictions, labels=["ham", "spam"]
        ).tolist(),
    }


def main():
    original = load_original_data()
    print(f"Original cleaned dataset: {len(original)} emails")
    print("Original label counts:")
    print(original["label"].value_counts().to_dict())

    # First reserve the final test set from ORIGINAL data.
    train_validation, test = train_test_split(
        original,
        test_size=0.20,
        random_state=RANDOM_STATE,
        stratify=original["label"],
    )

    # Then split the remaining original data into train and validation.
    train, validation = train_test_split(
        train_validation,
        test_size=0.20,
        random_state=RANDOM_STATE,
        stratify=train_validation["label"],
    )

    # Fit a baseline model on original training examples only.
    baseline = make_model()
    baseline.fit(train["text"], train["label"])
    baseline_validation = evaluate(
        baseline, validation["text"], validation["label"]
    )

    # Augment ONLY the training split. Validation/test remain untouched.
    extra = pd.DataFrame(EXTRA_EMAILS, columns=["label", "text"])
    augmented_train = pd.concat([train, extra], ignore_index=True)
    augmented_train = augmented_train.drop_duplicates(
        subset=["label", "text"]
    )

    augmented = make_model()
    augmented.fit(augmented_train["text"], augmented_train["label"])
    augmented_validation = evaluate(
        augmented, validation["text"], validation["label"]
    )

    print("\nValidation results (used for model selection):")
    print("Baseline F1:", baseline_validation["f1_spam"])
    print("Augmented F1:", augmented_validation["f1_spam"])

    # Choose using validation F1, not the final test set.
    if augmented_validation["f1_spam"] > baseline_validation["f1_spam"]:
        chosen = augmented
        chosen_name = "Logistic Regression (augmented training)"
    else:
        chosen = baseline
        chosen_name = "Logistic Regression (original training)"

    # Evaluate the selected model on the untouched original test set once.
    test_metrics = evaluate(chosen, test["text"], test["label"])

    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(chosen, MODEL_PATH)

    output = {
        "best_model": chosen_name,
        "dataset_rows_after_cleaning": int(len(original)),
        "train_rows_original": int(len(train)),
        "augmentation_examples_added": int(len(EXTRA_EMAILS)),
        "validation_rows": int(len(validation)),
        "test_rows": int(len(test)),
        "baseline_validation": baseline_validation,
        "augmented_validation": augmented_validation,
        "final_test_metrics": test_metrics,
        "note": (
            "Final test metrics use original held-out data. "
            "Synthetic examples were added only to training data. "
            "Predicted probabilities are not necessarily calibrated."
        ),
    }

    METRICS_PATH.write_text(json.dumps(output, indent=2))
    print(f"\nSelected model: {chosen_name}")
    print("Final test metrics:")
    print(json.dumps(test_metrics, indent=2))
    print(f"\nSaved model to: {MODEL_PATH}")
    print(f"Saved metrics to: {METRICS_PATH}")


if __name__ == "__main__":
    main()
