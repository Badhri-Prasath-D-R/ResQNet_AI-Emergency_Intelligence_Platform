import pytest
from app.core.security import get_password_hash, verify_password, create_access_token, verify_access_token

def calculate_priority_score(
    people_affected: float,
    medical_severity: float,
    vulnerability: float,
    ai_confidence: float,
    travel_time: float,
    resource_cost: float,
    shelter_overload: float
) -> float:
    # Formula matching the specification
    score = (
        0.40 * people_affected +
        0.30 * medical_severity +
        0.20 * vulnerability +
        0.10 * ai_confidence -
        0.15 * travel_time -
        0.10 * resource_cost -
        0.05 * shelter_overload
    )
    return round(score, 2)

def test_priority_score_calculation():
    # Test case 1
    score = calculate_priority_score(
        people_affected=80.0,
        medical_severity=70.0,
        vulnerability=60.0,
        ai_confidence=90.0,
        travel_time=15.0,
        resource_cost=20.0,
        shelter_overload=10.0
    )
    # Expected: 0.4*80(32) + 0.3*70(21) + 0.2*60(12) + 0.1*90(9) - 0.15*15(2.25) - 0.1*20(2) - 0.05*10(0.5)
    # Expected: 32 + 21 + 12 + 9 - 2.25 - 2 - 0.5 = 74 - 4.75 = 69.25
    assert score == 69.25

def test_password_security():
    pwd = "eocpassword123"
    hashed = get_password_hash(pwd)
    assert verify_password(pwd, hashed) is True
    assert verify_password("wrong", hashed) is False

def test_jwt_generation_verification():
    payload = {"username": "tester", "role": "Field Responder"}
    token = create_access_token(payload)
    decoded = verify_access_token(token)
    assert decoded["username"] == "tester"
    assert decoded["role"] == "Field Responder"
