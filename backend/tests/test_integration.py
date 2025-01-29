# tests/test_integration.py
import pytest
from fastapi.testclient import TestClient
from main import app

@pytest.mark.integration
def test_error_handling(test_db, client):
    """Test various error scenarios in the API"""
    # Test non-existent recipe
    response = client.get("/recipes/9999")
    assert response.status_code == 404
    
    # Test invalid recipe ID format
    response = client.get("/recipes/invalid")
    assert response.status_code == 422  # FastAPI validation error
    
    # Test invalid rating (out of range)
    response = client.post("/recipes/1/rate", params={"rating": 6})
    assert response.status_code == 400
    
    # Test invalid user creation
    response = client.post("/users/", json={
        "username": "",
        "email": "invalid_email",
        "dietary_preferences": []
    })
    assert response.status_code == 422  # FastAPI validation error

@pytest.mark.integration
def test_recipe_not_found(test_db, client):
    """Test specific recipe not found scenario"""
    response = client.get("/recipes/9999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Recipe not found"

@pytest.mark.integration
def test_invalid_rating(test_db, client):
    """Test invalid rating validation"""
    response = client.post("/recipes/1/rate", params={"rating": 6})
    assert response.status_code == 400
    assert response.json()["detail"] == "Rating must be between 0 and 5"

@pytest.fixture(autouse=True)
def cleanup_db(test_engine):
    """Clean up the database after each test"""
    yield
    test_engine.dispose()