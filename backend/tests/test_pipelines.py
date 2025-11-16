"""Tests for research pipelines."""
import pytest
from datetime import datetime
from app.pipelines.fallback_pipeline import (
    clean_text,
    tokenize,
    extract_keywords,
    jaccard_similarity,
    deduplicate_items,
    compute_sentiment,
    cluster_items_simple,
    run as fallback_run,
)
from app.schemas.research import ResearchRequest


class TestTextProcessing:
    """Test text cleaning and tokenization."""

    def test_clean_text_removes_urls(self):
        text = "Check this out https://example.com amazing!"
        result = clean_text(text)
        assert "https" not in result
        assert "example.com" not in result
        assert "amazing" in result

    def test_clean_text_lowercases(self):
        text = "HELLO World"
        result = clean_text(text)
        assert result == "hello world"

    def test_clean_text_removes_special_chars(self):
        text = "Hello! How are you? #great"
        result = clean_text(text)
        assert "!" not in result
        assert "?" not in result
        assert "#" not in result

    def test_tokenize_removes_stopwords(self):
        text = "the quick brown fox jumps over the lazy dog"
        tokens = tokenize(text)
        assert "the" not in tokens
        assert "quick" in tokens
        assert "brown" in tokens

    def test_tokenize_empty_string(self):
        tokens = tokenize("")
        assert tokens == []

    def test_extract_keywords(self):
        tokens = ["test", "test", "hello", "world", "test"]
        keywords = extract_keywords(tokens, max_keywords=2)
        assert keywords[0] == "test"
        assert len(keywords) <= 2


class TestSimilarity:
    """Test similarity calculations."""

    def test_jaccard_similarity_identical(self):
        tokens_a = ["hello", "world"]
        tokens_b = ["hello", "world"]
        similarity = jaccard_similarity(tokens_a, tokens_b)
        assert similarity == 1.0

    def test_jaccard_similarity_no_overlap(self):
        tokens_a = ["hello"]
        tokens_b = ["world"]
        similarity = jaccard_similarity(tokens_a, tokens_b)
        assert similarity == 0.0

    def test_jaccard_similarity_partial(self):
        tokens_a = ["hello", "world"]
        tokens_b = ["hello", "universe"]
        similarity = jaccard_similarity(tokens_a, tokens_b)
        assert 0.0 < similarity < 1.0

    def test_jaccard_similarity_empty(self):
        similarity = jaccard_similarity([], [])
        assert similarity == 1.0


class TestDeduplication:
    """Test item deduplication."""

    def test_deduplicate_items_removes_duplicates(self):
        items = [
            {"clean_text": "hello world test"},
            {"clean_text": "hello world test"},
            {"clean_text": "completely different text"},
        ]
        result = deduplicate_items(items, threshold=0.9)
        assert len(result) == 2

    def test_deduplicate_items_preserves_unique(self):
        items = [
            {"clean_text": "first item"},
            {"clean_text": "second item"},
            {"clean_text": "third item"},
        ]
        result = deduplicate_items(items, threshold=0.9)
        assert len(result) == 3


class TestSentimentAnalysis:
    """Test sentiment analysis."""

    def test_compute_sentiment_positive(self):
        text = "This is absolutely amazing and wonderful!"
        score = compute_sentiment(text)
        assert score > 0

    def test_compute_sentiment_negative(self):
        text = "This is terrible and awful!"
        score = compute_sentiment(text)
        assert score < 0

    def test_compute_sentiment_neutral(self):
        text = "This is a statement."
        score = compute_sentiment(text)
        assert -0.5 <= score <= 0.5

    def test_compute_sentiment_empty(self):
        score = compute_sentiment("")
        assert score == 0.0


class TestClustering:
    """Test item clustering."""

    def test_cluster_items_simple(self):
        items = [
            {"clean_text": "bug error problem", "text": "Found a bug"},
            {"clean_text": "error issue problem", "text": "Having an issue"},
            {"clean_text": "feature request new", "text": "New feature"},
        ]
        clusters = cluster_items_simple(items, num_clusters=2)
        assert len(clusters) == 2
        assert all("label" in cluster for cluster in clusters)
        assert all("items" in cluster for cluster in clusters)

    def test_cluster_items_empty(self):
        clusters = cluster_items_simple([], num_clusters=2)
        assert clusters == []


class TestFallbackPipeline:
    """Test complete fallback pipeline."""

    def test_fallback_pipeline_runs(self):
        request = ResearchRequest(
            topic="test topic",
            sources=["reddit"],
            query_terms=["test"],
        )
        run_id = "test-run-001"
        
        summary, payload = fallback_run(run_id, request, None)
        
        assert summary is not None
        assert payload is not None
        assert summary.top_pain_points is not None
        assert summary.recommended_actions is not None
        assert payload.items is not None
        assert payload.clusters is not None

    def test_fallback_pipeline_with_data(self):
        request = ResearchRequest(
            topic="product issues",
            sources=["reddit"],
            query_terms=["problem", "bug"],
        )
        existing_data = [
            {
                "text": "I found a critical bug in the product",
                "source": "reddit",
                "author": "user1",
                "created_at": datetime.utcnow().isoformat(),
            },
            {
                "text": "Having issues with the feature",
                "source": "reddit",
                "author": "user2",
                "created_at": datetime.utcnow().isoformat(),
            },
        ]
        
        summary, payload = fallback_run("test-run-002", request, existing_data)
        
        assert len(payload.items) > 0
        assert len(summary.top_pain_points) > 0
