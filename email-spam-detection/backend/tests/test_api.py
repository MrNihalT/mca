"""
Automated test suite for MailGuard FastAPI application.

Tests:
- API health and root endpoints
- Behavior on legitimate transactional emails (appointment confirmations, receipts, delivery updates, meetings)
- Behavior on spam/phishing emails (lottery scams, account suspensions, crypto frauds)
- Validation errors on empty/malformed inputs
"""

import pytest
from fastapi.testclient import TestClient
from pathlib import Path
import sys

# Ensure backend root is in sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from main import app, load_model


@pytest.fixture(scope="session", autouse=True)
def init_model():
    """Ensure model is loaded at test session start."""
    load_model()


@pytest.fixture
def client():
    return TestClient(app)


def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Email Spam Detection API"
    assert data["docs"] == "/docs"


def test_health_endpoint(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "model_loaded" in data


# --- Legitimate Transactional Emails ---

def test_appointment_confirmation_classified_as_ham(client):
    """Verify that the previously failing appointment confirmation is correctly predicted as ham."""
    payload = {
        "subject": "Appointment Confirmation for Wednesday",
        "body": (
            "Hello,\n\n"
            "This email confirms your appointment for Wednesday, October 28, at 3:00 PM. "
            "Please arrive a few minutes early. If you need to reschedule, contact our "
            "reception team during normal working hours.\n\n"
            "We look forward to seeing you.\n\n"
            "Regards,\nReception"
        )
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["prediction"] == "ham", f"Expected 'ham' but got '{data['prediction']}' with prob {data.get('spam_probability')}"
    assert data["spam_probability"] is not None
    assert data["spam_probability"] < 0.50


def test_dental_clinic_reminder_classified_as_ham(client):
    payload = {
        "subject": "Dental Checkup Reminder - Tomorrow at 10 AM",
        "body": (
            "Dear Patient, this is a reminder for your upcoming hygiene and cleaning "
            "appointment with Dr. Miller tomorrow at 10:00 AM. Please call our clinic "
            "if you need to reschedule."
        )
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["prediction"] == "ham"
    assert data["spam_probability"] < 0.50


def test_order_receipt_classified_as_ham(client):
    payload = {
        "subject": "Order Confirmation #8492041",
        "body": (
            "Thank you for your purchase. We have received your order for the items listed below. "
            "Your order total is $42.50 charged to your Visa ending in 4102. You will receive tracking "
            "information once your package departs our fulfillment center."
        )
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["prediction"] == "ham"
    assert data["spam_probability"] < 0.50


def test_package_delivery_tracking_classified_as_ham(client):
    payload = {
        "subject": "Your package has shipped! Tracking #94001118992",
        "body": (
            "Your shipment is in transit. Estimated delivery date: Thursday by 7:00 PM. "
            "Track package progress through your verified account dashboard."
        )
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["prediction"] == "ham"
    assert data["spam_probability"] < 0.50


def test_team_meeting_invitation_classified_as_ham(client):
    payload = {
        "subject": "Sprint Planning Meeting - Thursday 2 PM",
        "body": (
            "Hi team,\n\n"
            "Our bi-weekly sprint planning session is scheduled for Thursday from 2:00 PM to 3:30 PM. "
            "Please review the backlog and add any discussion points to the shared document before we meet.\n\n"
            "Thanks,\nSarah"
        )
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["prediction"] == "ham"
    assert data["spam_probability"] < 0.50


def test_university_seminar_notice_classified_as_ham(client):
    payload = {
        "subject": "Department Lecture: Deep Learning in Healthcare",
        "body": (
            "Dear students and faculty, You are invited to attend a guest lecture by Dr. Alan Walker "
            "this Friday at 4:00 PM in the Science Auditorium. Refreshments will be served after the Q&A."
        )
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["prediction"] == "ham"
    assert data["spam_probability"] < 0.50


# --- Spam & Phishing Scams ---

def test_lottery_scam_classified_as_spam(client):
    payload = {
        "subject": "CONGRATULATIONS! YOU HAVE WON $5,000,000 IN CASH",
        "body": (
            "Dear Winner, your email was selected in our international balloting sweepstakes. "
            "To claim your five million dollar prize payout, reply with your full bank account details "
            "and wire a $250 release fee immediately."
        )
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["prediction"] == "spam"
    assert data["spam_probability"] >= 0.50


def test_urgent_phishing_suspension_classified_as_spam(client):
    payload = {
        "subject": "URGENT: Your Bank Account Access Has Been Suspended",
        "body": (
            "Security Alert: Unauthorized login attempts were detected on your online profile. "
            "Your debit card is frozen. Click this link immediately and enter your social security number, "
            "password, and PIN to restore access."
        )
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["prediction"] == "spam"
    assert data["spam_probability"] >= 0.50


def test_advance_fee_inheritance_classified_as_spam(client):
    payload = {
        "subject": "CONFIDENTIAL BUSINESS PROPOSAL - $18.5M INHERITANCE",
        "body": (
            "I am barrister James Williams. A deceased foreign diplomat left $18,500,000 with no next of kin. "
            "I request your partnership to claim these funds. You will receive 40% of the total sum. "
            "Reply with your phone number and bank details."
        )
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["prediction"] == "spam"
    assert data["spam_probability"] >= 0.50


def test_crypto_doubling_scam_classified_as_spam(client):
    payload = {
        "subject": "Double your Bitcoin in 24 Hours Guaranteed!",
        "body": (
            "Limited promo: Send between 0.1 BTC and 2 BTC to our automated smart contract address "
            "and receive double your coins back within 24 hours. Don't miss out on this financial opportunity!"
        )
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["prediction"] == "spam"
    assert data["spam_probability"] >= 0.50


# --- Validation and Edge Cases ---

def test_empty_body_rejected_with_422(client):
    payload = {"subject": "Test", "body": ""}
    response = client.post("/predict", json=payload)
    assert response.status_code == 422


def test_missing_body_rejected_with_422(client):
    payload = {"subject": "Test"}
    response = client.post("/predict", json=payload)
    assert response.status_code == 422


def test_empty_subject_allowed_if_body_present(client):
    payload = {
        "subject": "",
        "body": "Hi team, our review is postponed to Friday afternoon. Thank you."
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["prediction"] in ["ham", "spam"]
