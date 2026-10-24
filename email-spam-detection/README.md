# MailGuard — Email Spam Detection ML Project

An intermediate-level machine-learning project with a React frontend, FastAPI backend, TF-IDF text features, and two classifiers (Multinomial Naive Bayes and Logistic Regression).

## Features
- Paste an email subject and body to classify it as `spam` or `ham` (not spam).
- Download and normalize a public SpamAssassin corpus dataset.
- Compare models using accuracy, spam precision, spam recall, spam F1, classification report, and confusion matrix.
- Save the best pipeline as a Joblib artifact and load it in FastAPI.
- Responsive React interface with an estimated spam probability where supported.

## Architecture
React (Vite) → FastAPI `/predict` → saved scikit-learn pipeline → prediction.

## Dataset Sources & Provenance

1. **Multi-Source Diverse Dataset (Primary):**
   - Source: [locuoco/the-biggest-spam-ham-phish-email-dataset-300000](https://huggingface.co/datasets/locuoco/the-biggest-spam-ham-phish-email-dataset-300000)
   - Provenance: Kaggle (Akshat Sharma) combining Enron (workplace/transactional), LingSpam, CEAS, and Nazario phishing corpora.
   - License: MIT.
   - Raw records: 365,448 (0: Ham: 168,455; 1: Phish: 42,845; 2: Spam: 154,148).
   - Deduplicated unique records: 279,151.
   - Binary Mapping Policy: Raw label `0` maps to `ham`; raw label `1` (phishing) and `2` (spam) map to `spam`. Original labels are preserved in `dataset_metadata.json` for auditing.

2. **SpamAssassin Public Mail Corpus (Fallback & External Cross-Dataset Benchmark):**
   - Original corpus: https://spamassassin.apache.org/old/publiccorpus/
   - Hugging Face: `talby/spamassassin` (6,098 emails).
   - Serves as an independent out-of-distribution external benchmark to test generalization.

## Requirements
- Python 3.10+
- Node.js 20+ and npm
- Dependencies listed in `backend/requirements.txt` and `frontend/package.json`

## Quickstart

### 1. Prepare Dataset and Train Model

Open Terminal in the `backend` directory:

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Step 1: Clean, deduplicate, and prepare 80,000 balanced records
python prepare_dataset.py --sample-size 80000

# Step 2: Train candidate pipelines, evaluate on validation split, and benchmark
python train.py

# Step 3: Run the automated test suite
pytest tests/test_api.py
```

Training creates:
- `backend/models/spam_model.joblib` (atomic safe write with automatic `.bak` backup)
- `backend/metrics.json` (detailed split metrics, confusion matrices, and benchmark reports)
- `backend/data/dataset_metadata.json` (dataset provenance and distribution audit)

### 2. Start the FastAPI Backend

```bash
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Endpoints:
- API health: http://127.0.0.1:8000/health (`{"status":"ok","model_loaded":true}`)
- Interactive API documentation: http://127.0.0.1:8000/docs
- Prediction endpoint: `POST http://127.0.0.1:8000/predict`

### 3. Start the React Frontend

Open a second Terminal:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Open http://localhost:5173.

---

## Machine Learning Architecture & Evaluation

### Data Leakage Prevention
- **Strict Split**: 70% Training (56,000), 15% Validation (12,000), and 15% Held-Out Test (12,000), stratified by class with fixed seed `RANDOM_STATE = 42`.
- **Feature Union**: Word TF-IDF (`ngram_range=(1, 2)`) + Character TF-IDF (`analyzer='char_wb', ngram_range=(3, 5)`), fit **strictly** on the training partition.
- **Model Selection**: Validation split is used exclusively for comparing candidates (MultinomialNB vs LogisticRegression) and evaluating threshold trade-offs.
- **Held-Out Test**: The test partition is evaluated **once** after model selection is finalized.

### Performance Summary

| Metric | Baseline MNB (alpha=0.1) | Selected Logistic Regression (C=2.0) |
| :--- | :--- | :--- |
| **Validation Accuracy** | 96.69% | **98.08%** |
| **Validation Spam F1** | 96.65% | **98.08%** |
| **Validation Spam Precision** | 97.95% | **97.83%** |
| **Validation Spam Recall** | 95.38% | **98.33%** |
| **Validation False Positive Rate (ham→spam)** | 2.00% (120 FPs) | **2.18% (131 FPs)** |
| **Held-Out Test Accuracy** | — | **97.88%** |
| **Held-Out Test Spam F1** | — | **97.88%** |
| **Held-Out Test False Positives** | — | 148 / 6,000 (FPR: 2.47%) |
| **Held-Out Test False Negatives** | — | 107 / 6,000 (FNR: 1.78%) |
| **Model Size on Disk** | ~2.5 MB | **1.49 MB** |

### Dedicated Real-World Benchmarks

1. **Transactional Ham Evaluation**:
   - Evaluated against realistic transactional emails (appointment confirmations, receipts, shipping updates, calendar invitations, university announcements).
   - **Appointment confirmation false positive resolved:**
     - Previous SpamAssassin model: classified as **`spam` (66.98% probability)**
     - New Multi-Source model: classified as **`ham` (0.72% probability)**
2. **Dedicated Modern Spam Suite**:
   - 100% recall on real-world phishing alerts, international lottery scams, cryptocurrency doubling frauds, advance-fee inheritance scams, and malicious invoice attachments.
3. **Automated Test Suite**:
   - `pytest tests/test_api.py` includes 15 automated test cases covering endpoints, payload validation, edge cases, and transactional messages.

---

## Deployment Guide

### Backend (Render / Cloud Container)
- **Root directory:** `backend`
- **Environment:** Python 3.10+
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
- **Model Artifact:** For production stability, the compact model artifact (`backend/models/spam_model.joblib`, 1.49 MB) can be loaded directly without requiring training on every deployment.
- **CORS Configuration:** Update `allow_origins` in `backend/main.py` with your deployed frontend domain.

### Frontend (Vercel / Netlify)
- **Root directory:** `frontend`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Environment Variable:** `VITE_API_URL=https://your-backend-api.onrender.com` (no trailing slash).

---

## Security & Ethical Considerations
- MailGuard is an educational and analytical machine learning tool, not an enterprise email security gateway.
- Do not paste confidential or personally identifiable emails into public cloud deployments.
- Predicted probabilities reflect model confidence on feature distributions, not absolute real-world risk guarantees.
