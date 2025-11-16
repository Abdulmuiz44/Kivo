"""Tests for service layer."""
import pytest
from app.services.research_runner import ResearchRunner
from app.schemas.research import ResearchRequest


class TestResearchRunner:
    """Test ResearchRunner service."""

    @pytest.fixture
    def runner(self):
        """Create a ResearchRunner instance."""
        return ResearchRunner()

    def test_start_run(self, runner):
        """Test starting a research run."""
        request = ResearchRequest(
            topic="test topic",
            sources=["reddit"],
            query_terms=["test"],
        )
        run_id = runner.start_run(request)
        
        assert run_id is not None
        assert isinstance(run_id, str)
        assert len(run_id) > 0

    def test_get_status_nonexistent(self, runner):
        """Test getting status for non-existent run."""
        status = runner.get_status("nonexistent-id")
        assert status is None

    def test_get_status_existing(self, runner):
        """Test getting status for existing run."""
        request = ResearchRequest(
            topic="test",
            sources=["reddit"],
            query_terms=["test"],
        )
        run_id = runner.start_run(request)
        
        status = runner.get_status(run_id)
        assert status is not None
        assert "run_id" in status
        assert "status" in status
        assert status["run_id"] == run_id

    def test_get_summary_not_ready(self, runner):
        """Test getting summary before it's ready."""
        request = ResearchRequest(
            topic="test",
            sources=["reddit"],
            query_terms=["test"],
        )
        run_id = runner.start_run(request)
        
        # Summary might not be ready immediately
        summary = runner.get_summary(run_id)
        # Could be None or a summary depending on timing
        assert summary is None or isinstance(summary, dict)

    def test_get_payload_not_ready(self, runner):
        """Test getting payload before it's ready."""
        request = ResearchRequest(
            topic="test",
            sources=["reddit"],
            query_terms=["test"],
        )
        run_id = runner.start_run(request)
        
        payload = runner.get_payload(run_id)
        assert payload is None or isinstance(payload, dict)

    def test_multiple_runs(self, runner):
        """Test creating multiple runs."""
        request1 = ResearchRequest(
            topic="topic 1",
            sources=["reddit"],
            query_terms=["test1"],
        )
        request2 = ResearchRequest(
            topic="topic 2",
            sources=["reddit"],
            query_terms=["test2"],
        )
        
        run_id1 = runner.start_run(request1)
        run_id2 = runner.start_run(request2)
        
        assert run_id1 != run_id2
        assert runner.get_status(run_id1) is not None
        assert runner.get_status(run_id2) is not None
