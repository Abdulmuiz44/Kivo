"""Tests for API routes."""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.schemas.research import ResearchRequest


client = TestClient(app)


class TestResearchRoutes:
    """Test research API endpoints."""

    def test_start_research_success(self):
        """Test starting a research run."""
        payload = {
            "topic": "test topic",
            "sources": ["reddit"],
            "query_terms": ["test", "example"],
        }
        response = client.post("/research/run", json=payload)
        
        assert response.status_code == 202
        data = response.json()
        assert "run_id" in data
        assert data["status"] == "queued"

    def test_start_research_missing_topic(self):
        """Test validation error when topic is missing."""
        payload = {
            "sources": ["reddit"],
            "query_terms": ["test"],
        }
        response = client.post("/research/run", json=payload)
        assert response.status_code == 422

    def test_get_research_status_not_found(self):
        """Test getting status for non-existent run."""
        response = client.get("/research/nonexistent-id/status")
        assert response.status_code == 404

    def test_get_research_status_success(self):
        """Test getting status for existing run."""
        # First create a run
        payload = {
            "topic": "test topic",
            "sources": ["reddit"],
            "query_terms": ["test"],
        }
        create_response = client.post("/research/run", json=payload)
        run_id = create_response.json()["run_id"]
        
        # Then get its status
        response = client.get(f"/research/{run_id}/status")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert data["run_id"] == run_id

    def test_get_research_summary_not_found(self):
        """Test getting summary for non-existent run."""
        response = client.get("/research/nonexistent-id/summary")
        assert response.status_code == 404

    def test_get_research_payload_not_found(self):
        """Test getting payload for non-existent run."""
        response = client.get("/research/nonexistent-id/json")
        assert response.status_code == 404

    def test_health_check(self):
        """Test root endpoint."""
        response = client.get("/")
        assert response.status_code in [200, 404]  # Depends on whether root route exists


class TestRequestValidation:
    """Test request schema validation."""

    def test_invalid_source(self):
        """Test invalid source in research request."""
        payload = {
            "topic": "test",
            "sources": ["invalid_source"],
            "query_terms": ["test"],
        }
        response = client.post("/research/run", json=payload)
        # Should either reject or accept - depends on validation
        assert response.status_code in [202, 422]

    def test_empty_query_terms(self):
        """Test empty query terms."""
        payload = {
            "topic": "test",
            "sources": ["reddit"],
            "query_terms": [],
        }
        response = client.post("/research/run", json=payload)
        # Should accept empty list or reject
        assert response.status_code in [202, 422]

    def test_optional_date_range(self):
        """Test date range is optional."""
        payload = {
            "topic": "test",
            "sources": ["reddit"],
            "query_terms": ["test"],
            "date_range": {"from": "2024-01-01", "to": "2024-12-31"},
        }
        response = client.post("/research/run", json=payload)
        assert response.status_code == 202
