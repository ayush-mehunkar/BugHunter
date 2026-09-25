from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_health():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["success"] is True
    assert response.json()["service"] == "BugHunter AI Service"
    assert response.json()["status"] == "healthy"


def test_analyze_bug():
    payload = {
        "title": "Commercial API verification fails",
        "description": "The API verification request fails when a commercial property is submitted.",
        "environment": "Local development",
        "stepsToReproduce": "Open the property verification form, enter valid property details, submit the form, and observe the response.",
        "expectedResult": "The property should be verified successfully and a success response should be returned.",
        "actualResult": "The request returns an error and the property is not verified.",
    }

    response = client.post("/analyze", json=payload)

    assert response.status_code == 200

    body = response.json()

    assert body["success"] is True
    assert body["message"] == "Bug analysis completed successfully"

    analysis = body["analysis"]

    assert analysis["title"] == payload["title"]
    assert analysis["description"] == payload["description"]

    assert analysis["category"] == "Backend/API"
    assert analysis["severity"] == "Major"
    assert analysis["priority"] == "High"

    assert analysis["summary"]
    assert analysis["possibleCause"]
    assert analysis["suggestedFix"]
    assert analysis["investigation"]
    assert analysis["rootCauseHypotheses"]
    assert analysis["evidence"]
    assert analysis["suggestedTests"]
    assert analysis["riskAssessment"]

    assert analysis["confidence"] > 0
    assert analysis["confidenceReason"]


def test_duplicate_check_should_find_similar_bug():
    payload = {
        "title": "Commercial API verification fails",
        "description": "The API verification request fails when a commercial property is submitted.",
        "existingBugs": [
            {
                "id": "BUG-001",
                "title": "Commercial API verification fails",
                "description": "The API verification request fails when a commercial property is submitted.",
            },
            {
                "id": "BUG-002",
                "title": "Login page styling issue",
                "description": "The login button has incorrect spacing.",
            },
        ],
    }

    response = client.post("/duplicate-check", json=payload)

    assert response.status_code == 200

    body = response.json()

    assert body["success"] is True
    assert body["message"] == "Duplicate bug check completed successfully"
    assert body["isDuplicate"] is True
    assert body["matches"]

    assert body["matches"][0]["bugId"] == "BUG-001"
    assert body["matches"][0]["similarity"] == 100.0


def test_duplicate_check_should_not_find_unrelated_bug():
    payload = {
        "title": "Payment gateway timeout",
        "description": "The payment gateway times out during checkout.",
        "existingBugs": [
            {
                "id": "BUG-003",
                "title": "Login page styling issue",
                "description": "The login button has incorrect spacing.",
            },
        ],
    }

    response = client.post("/duplicate-check", json=payload)

    assert response.status_code == 200

    body = response.json()

    assert body["success"] is True
    assert body["message"] == "Duplicate bug check completed successfully"
    assert body["isDuplicate"] is False
    assert body["matches"] == []


def test_analyze_bug_should_reject_missing_required_field():
    payload = {
        "description": "The API verification request fails.",
    }

    response = client.post("/analyze", json=payload)

    assert response.status_code == 422
