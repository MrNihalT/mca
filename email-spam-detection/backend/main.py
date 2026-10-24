"""FastAPI inference API for the trained email spam classifier."""
from pathlib import Path
from typing import Optional
import joblib
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

BASE_DIR = Path(__file__).parent
MODEL_PATH = BASE_DIR / "models" / "spam_model.joblib"

app = FastAPI(title="Email Spam Detection API", version="1.0.0",
              description="Classifies pasted email subject/body text as spam or ham.")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

model = None

class EmailRequest(BaseModel):
    subject: str = Field(default="", max_length=500)
    body: str = Field(min_length=1, max_length=30000)

class PredictionResponse(BaseModel):
    prediction: str
    spam_probability: Optional[float] = None
    message: str

@app.on_event("startup")
def load_model():
    global model
    if MODEL_PATH.exists():
        model = joblib.load(MODEL_PATH)

@app.get("/")
def root():
    return {"message": "Email Spam Detection API", "docs": "/docs"}

@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": model is not None}

@app.post("/predict", response_model=PredictionResponse)
def predict_email(payload: EmailRequest):
    if model is None:
        raise HTTPException(
            status_code=503,
            detail="Model is not trained yet. Run `python train.py` in the backend folder."
        )
    text = f"Subject: {payload.subject.strip()}\n\n{payload.body.strip()}".strip()
    prediction = str(model.predict([text])[0])
    spam_probability = None
    if hasattr(model, "predict_proba"):
        classes = list(model.classes_)
        if "spam" in classes:
            spam_probability = round(float(model.predict_proba([text])[0][classes.index("spam")]), 4)
    return PredictionResponse(
        prediction=prediction,
        spam_probability=spam_probability,
        message="Likely spam" if prediction == "spam" else "Likely legitimate (not spam)"
    )
