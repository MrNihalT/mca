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

## Dataset source
This project downloads the SpamAssassin public mail corpus through the Hugging Face Datasets package:
- Original corpus: https://spamassassin.apache.org/old/publiccorpus/
- Dataset card: https://huggingface.co/datasets/talby/spamassassin

The corpus is historical and may not represent modern phishing or spam. The downloader saves a normalized `backend/data/emails.csv` with `label` (`spam`/`ham`) and `text` columns. Review the dataset terms and cite the source in academic submissions.

## Requirements
- Python 3.10+ recommended
- Node.js 20+ and npm
- Internet access for the first dataset download and Google Fonts (optional)

## 1. Train the model

Open Terminal in the project root:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
python download_dataset.py
python train.py
```

Windows PowerShell activation: `.venv\Scripts\Activate.ps1`

Training creates:
- `backend/models/spam_model.joblib`
- `backend/metrics.json`

Record the actual scores printed by your own training run. Do not claim a specific accuracy before you run the evaluation.

## 2. Start the API

In the same `backend` directory and with the virtual environment activated:

```bash
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Check:
- API health: http://127.0.0.1:8000/health
- Interactive API docs: http://127.0.0.1:8000/docs

Expected health response after training: `{"status":"ok","model_loaded":true}`.

## 3. Start the React frontend

Open a second Terminal:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Open the Vite URL shown in Terminal, usually http://localhost:5173.

## 4. Test the API directly

```bash
curl -X POST http://127.0.0.1:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"subject":"You won a prize","body":"Click here now to claim your free cash reward"}'
```

Try a normal email too:
`{"subject":"Project meeting","body":"Hi team, our project meeting is scheduled for 10 AM tomorrow."}`

These are examples only. Model predictions can vary.

## 5. Understand the evaluation

- **Precision (spam):** Of emails flagged as spam, how many really were spam?
- **Recall (spam):** Of all spam emails in the test set, how many did the model catch?
- **F1-score:** Harmonic mean of spam precision and spam recall.
- **Confusion matrix:** Rows are actual labels and columns are predicted labels in the order `ham`, `spam`.

False positives matter: a legitimate email incorrectly classified as spam can cause a user to miss an important message.

## 6. Deployment overview

Deploy backend and frontend separately.

### Backend (Render or another Python ASGI host)
- Root directory: `backend`
- Build command: `pip install -r requirements.txt && python download_dataset.py && python train.py`
- Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- The dataset download and training during build can make deploys slower. For a more stable deployment, train locally, then deploy the model artifact using your host's supported artifact/storage workflow. Do not commit the model or dataset unless you intentionally choose to.
- Configure the frontend origin in `backend/main.py` CORS `allow_origins` before deploying.

### Frontend (Vercel or Netlify)
- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`
- Environment variable: `VITE_API_URL=https://YOUR-BACKEND-DOMAIN`
- Redeploy after setting environment variables.

Use the actual deployed backend URL; don't include a trailing slash in `VITE_API_URL`.

## Security and limitations
- This is a learning/demo classifier, not a production email security gateway.
- Do not paste confidential emails into a public deployment.
- Do not automatically delete or block email based on this prediction.
- The model can miss new spam styles and can misclassify legitimate messages.
- The training pipeline uses a random held-out split; for stronger evaluation, use a time-based or separate-source test set and remove near-duplicates before splitting.
- Joblib/pickle files can execute code when loaded. Only load model artifacts you created or trust.
