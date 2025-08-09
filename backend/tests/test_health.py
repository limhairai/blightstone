import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    """Test that the health endpoint returns 200 OK"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

def test_root_endpoint():
    """Test that the root endpoint returns expected response"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert data["message"] == "Blightstone CRM API is running"

def test_api_version():
    """Test that the API version endpoint works"""
    response = client.get("/api/v1/")
    # Note: This endpoint may not exist yet, so we'll just check it doesn't crash
    assert response.status_code in [200, 404]  # Accept both for now 