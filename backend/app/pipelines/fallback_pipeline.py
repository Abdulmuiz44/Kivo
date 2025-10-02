from __future__ import annotations

import math
import re
from collections import Counter
from datetime import datetime
from typing import Any, Dict, Iterable, List, Optional, Sequence, Tuple

from ..schemas.research import ResearchRequest, ResearchSummary

try:
    from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
except ImportError:  # pragma: no cover - dependency missing only in unsupported envs
    SentimentIntensityAnalyzer = None


FALLBACK_STOPWORDS = {
    "a",
    "an",
    "and",
    "are",
    "as",
    "at",
    "be",
    "but",
    "by",
    "for",
    "from",
    "how",
    "i",
    "if",
    "in",
    "is",
    "it",
    "of",
    "on",
    "or",
    "the",
    "to",
    "we",
    "what",
    "when",
    "where",
    "who",
    "why",
    "with",
    "you",
    "your",
}

PROBLEM_HINTS = [
    "problem",
    "issue",
    "bug",
    "error",
    "help",
    "need",
    "stuck",
    "question",
    "anyone else",
    "broken",
    "cannot",
]


def clean_text(text: str) -> str:
    normalized = text or ""
    normalized = normalized.lower()
    normalized = re.sub(r"https?://\S+", " ", normalized)
    normalized = re.sub(r"[^a-z0-9\s]", " ", normalized)
    normalized = re.sub(r"\s+", " ", normalized).strip()
    return normalized


def tokenize(text: str) -> List[str]:
    return [token for token in clean_text(text).split() if token and token not in FALLBACK_STOPWORDS]


def extract_keywords(tokens: Iterable[str], max_keywords: int = 5) -> List[str]:
    counts = Counter(tokens)
    return [token for token, _ in counts.most_common(max_keywords)]


def jaccard_similarity(a_tokens: Iterable[str], b_tokens: Iterable[str]) -> float:
    set_a = set(a_tokens)
    set_b = set(b_tokens)
    if not set_a and not set_b:
        return 1.0
    if not set_a or not set_b:
        return 0.0
    intersection = len(set_a & set_b)
    union = len(set_a | set_b)
    return intersection / union


def deduplicate_items(items: Sequence[Dict[str, Any]], threshold: float = 0.9) -> List[Dict[str, Any]]:
    unique: List[Dict[str, Any]] = []
    for candidate in items:
        candidate_tokens = tokenize(candidate.get("clean_text", ""))
        if any(jaccard_similarity(candidate_tokens, tokenize(existing.get("clean_text", ""))) >= threshold for existing in unique):
            continue
        unique.append(candidate)
    return unique


def greedy_cluster_items(
    items: Sequence[Dict[str, Any]],
    topic_tokens: Iterable[str],
    similarity_threshold: float = 0.6,
) -> List[Dict[str, Any]]:
    clusters: List[Dict[str, Any]] = []
    topic_token_set = set(topic_tokens)
    for item in items:
        item_tokens = tokenize(item.get("clean_text", ""))
        assigned = False
        for cluster in clusters:
            if jaccard_similarity(item_tokens, cluster["tokens"]) >= similarity_threshold:
                cluster["items"].append(item)
                cluster["tokens"].update(item_tokens)
                assigned = True
                break
        if not assigned:
            clusters.append({"items": [item], "tokens": set(item_tokens) or set(topic_token_set)})

    cluster_payload: List[Dict[str, Any]] = []
    for idx, cluster in enumerate(clusters, start=1):
        cluster_items = cluster["items"]
        representative = max(cluster_items, key=lambda entry: entry.get("engagement_score", 0.0))
        token_counts = Counter(tokenize(representative.get("clean_text", "")))
        top_keyword = token_counts.most_common(1)[0][0] if token_counts else representative.get("clean_text", "")[:50]
        statements = [
            f"Users are having challenges related to '{top_keyword}' when discussing {representative.get('source_topic', 'this topic')}."
        ]
        engagement_values = [entry.get("engagement_score", 0.0) for entry in cluster_items]
        avg_engagement = float(sum(engagement_values) / len(engagement_values)) if engagement_values else 0.0
        percent_of_total = len(cluster_items) / max(len(items), 1)
        cluster_payload.append(
            {
                "cluster_id": idx,
                "representative_text": representative.get("text", ""),
                "statements": statements,
                "count": len(cluster_items),
                "percent_of_total": percent_of_total,
                "avg_engagement": avg_engagement,
                "confidence": min(1.0, percent_of_total + (avg_engagement / 100.0)),
                "examples": [entry.get("url") for entry in cluster_items if entry.get("url")][:2],
                "tags": extract_keywords(cluster["tokens"], max_keywords=5),
            }
        )
    return cluster_payload


def build_summary(
    topic: str,
    clusters: Sequence[Dict[str, Any]],
    items: Sequence[Dict[str, Any]],
    created_at: datetime,
) -> Tuple[str, List[str], List[str], List[str], List[str]]:
    if not clusters:
        summary = (
            f"No publicly available Reddit or X posts were collected for '{topic}' during this run. "
            "Kivo fallback pipeline (lite mode) executed successfully."
        )
        return summary, [], [], [], []

    ranked_clusters = sorted(clusters, key=lambda c: (c["avg_engagement"], c["count"]), reverse=True)
    pain_points = [cluster["statements"][0] for cluster in ranked_clusters[:5]]
    product_hypotheses = [
        f"Consider simplifying workflows related to {cluster['tags'][0]} based on {cluster['count']} signals."
        for cluster in ranked_clusters[:3]
        if cluster.get("tags")
    ]
    recommended_actions = [
        "Review cluster representatives with the highest engagement for qualitative follow-up interviews.",
        "Schedule community monitoring to verify if pain points persist over the next week.",
        "Share findings with product/support teams to validate feasibility of quick fixes.",
    ]
    top_sources = [item.get("url") for item in items if item.get("url")] [:10]
    summary_text = (
        f"Identified {len(clusters)} discussion cluster(s) about '{topic}' on Reddit and X as of {created_at.date()}. "
        "Insights generated via lite heuristic pipeline."
    )
    return summary_text, pain_points, product_hypotheses, recommended_actions, top_sources


def compute_relevance(tokens: Iterable[str], topic_tokens: Iterable[str]) -> float:
    token_set = set(tokens)
    topic_set = set(topic_tokens)
    if not token_set or not topic_set:
        return 0.0
    overlap = len(token_set & topic_set)
    return overlap / len(topic_set)


def compute_engagement(raw_item: Dict[str, Any]) -> float:
    score = raw_item.get("score") or 0
    replies = raw_item.get("replies") or 0
    shares = raw_item.get("retweets_or_shares") or 0
    return float(score + (0.5 * replies) + (0.75 * shares))


def build_query_terms(topic: str) -> List[str]:
    base = clean_text(topic)
    if not base:
        return []
    expansions = {base}
    for hint in PROBLEM_HINTS:
        expansions.add(f"{base} {hint}")
    first_word = base.split()[0]
    expansions.add(f"#{first_word}")
    expansions.add(f"{first_word} help")
    return sorted(expansions)


def run_pipeline(
    run_id: str,
    request: ResearchRequest,
    raw_items: Optional[Sequence[Dict[str, Any]]] = None,
) -> Tuple[Dict[str, Any], ResearchSummary]:
    created_at = datetime.utcnow()
    analyzer = SentimentIntensityAnalyzer() if SentimentIntensityAnalyzer else None
    topic_tokens = tokenize(request.topic)
    processed_items: List[Dict[str, Any]] = []

    for raw_item in raw_items or []:
        text = raw_item.get("text", "")
        clean = clean_text(text)
        tokens = tokenize(text)
        sentiment = analyzer.polarity_scores(text) if analyzer else {"compound": 0.0, "pos": 0.0, "neu": 0.0, "neg": 0.0}
        processed_items.append(
            {
                "id": raw_item.get("id", ""),
                "platform": raw_item.get("platform", "unknown"),
                "author": raw_item.get("author", ""),
                "timestamp": raw_item.get("timestamp") if isinstance(raw_item.get("timestamp"), str) else raw_item.get("timestamp", created_at).isoformat() if raw_item.get("timestamp") else created_at.isoformat(),
                "text": text,
                "clean_text": clean,
                "score": raw_item.get("score"),
                "replies": raw_item.get("replies"),
                "retweets_or_shares": raw_item.get("retweets_or_shares"),
                "url": raw_item.get("url"),
                "subreddit_or_hashtag": raw_item.get("subreddit_or_hashtag"),
                "language": raw_item.get("language", "en"),
                "sentiment": sentiment,
                "keywords": extract_keywords(tokens),
                "relevance": round(compute_relevance(tokens, topic_tokens), 3),
                "removed_content_flag": bool(raw_item.get("removed_content_flag", False)),
                "engagement_score": compute_engagement(raw_item),
                "source_topic": request.topic,
            }
        )

    deduped_items = deduplicate_items(processed_items)
    clusters = greedy_cluster_items(deduped_items, topic_tokens)
    summary_text, pain_points, product_hypotheses, recommended_actions, top_sources = build_summary(
        request.topic,
        clusters,
        deduped_items,
        created_at,
    )

    payload = {
        "run_id": run_id,
        "topic": request.topic,
        "sources": request.sources,
        "query_terms": build_query_terms(request.topic),
        "date_range": {
            "from": request.from_date.isoformat() if request.from_date else None,
            "to": request.to_date.isoformat() if request.to_date else None,
        },
        "created_at": created_at.isoformat(),
        "items": deduped_items,
        "clusters": clusters,
        "summary": {
            "top_pain_points": pain_points,
            "recommended_actions": recommended_actions,
            "product_hypotheses": product_hypotheses,
            "top_sources": top_sources,
        },
        "pipeline_mode": "lite",
    }

    summary = ResearchSummary(
        run_id=run_id,
        topic=request.topic,
        created_at=created_at,
        summary_text=summary_text,
        top_pain_points=pain_points,
        product_hypotheses=product_hypotheses,
        recommended_actions=recommended_actions,
        top_sources=top_sources,
        confidence="low" if not clusters else "medium",
    )

    return payload, summary
