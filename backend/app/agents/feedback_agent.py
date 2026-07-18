import json
import httpx
from collections import Counter
from ..models.schemas import FeedbackInsights, FeedbackTheme, AgentTrace, TraceLog
from ..config import get_settings


THEME_KEYWORDS = {
    "delivery": ("delivery", "shipping", "late", "arrived"),
    "pricing": ("price", "expensive", "cost", "cheap"),
    "quality": ("quality", "broken", "defective", "broke"),
    "service": ("service", "support", "staff", "rude"),
}


def classify_feedback_theme(message: str) -> str:
    """Assign known themes deterministically; unmatched feedback is other."""
    normalized = message.casefold()
    for theme, keywords in THEME_KEYWORDS.items():
        if any(keyword in normalized for keyword in keywords):
            return theme
    return "other"


def analyze_feedback(messages: list[str]) -> tuple[FeedbackInsights, AgentTrace]:
    """Analyze feedback messages and return insights + trace."""
    settings = get_settings()
    use_api = bool(settings.anthropic_api_key)

    trace_logs: list[TraceLog] = [
        TraceLog(timestamp="00:00.000", type="trigger", text=f"Received {len(messages)} feedback messages"),
    ]

    if use_api:
        try:
            insights, extra_logs = _api_analysis(messages, settings)
        except Exception as exc:
            import logging
            logging.getLogger("feedback").warning(f"API analysis failed, falling back to mock: {exc}")
            insights, extra_logs = _mock_analysis(messages)
            extra_logs.insert(0, TraceLog(
                timestamp="00:00.100", type="trigger",
                text=f"API unavailable ({type(exc).__name__}), using local analysis"
            ))
    else:
        insights, extra_logs = _mock_analysis(messages)

    trace_logs.extend(extra_logs)
    trace_logs.append(
        TraceLog(
            timestamp="00:02.500", type="result",
            text=f"Identified {len(insights.themes)} themes across {insights.totalMessages} messages"
        )
    )

    trace = AgentTrace(
        agentName="Feedback Agent", agentIcon="📊", status="active",
        lastAction=f"Analyzed {len(messages)} feedback messages",
        lastRun="just now", logs=trace_logs
    )
    return insights, trace


def _api_analysis(messages: list[str], settings) -> tuple[FeedbackInsights, list[TraceLog]]:
    """Call your custom LLM API for analysis."""
    api_key = settings.anthropic_api_key
    base_url = getattr(settings, 'anthropic_base_url', 'https://api.anthropic.com')

    prompt = f"""Analyze these feedback messages and return a JSON object with themes.

Messages:
{json.dumps(messages, indent=2)}

Return ONLY valid JSON in this format:
{{
  "themes": [
    {{
      "theme": "delivery|pricing|quality|service|other",
      "severity": "low|medium|high",
      "fixSuggestion": "A concrete actionable fix",
      "messageCount": 1
    }}
  ],
  "totalMessages": {len(messages)}
}}

Group similar messages. Severity: high=5+ mentions, medium=3-4, low=1-2."""

    response = httpx.post(
        f"{base_url}/v1/messages",
        headers={
            "x-api-key": api_key,
            "content-type": "application/json",
            "anthropic-version": "2023-06-01",
        },
        json={
            "model": "mimo-v2.5-pro",
            "max_tokens": 1024,
            "messages": [{"role": "user", "content": prompt}]
        },
        timeout=30.0,
    )
    response.raise_for_status()

    # Handle multiple API response formats
    resp_json = response.json()
    try:
        # Anthropic Messages API format: { "content": [{ "text": "..." }] }
        result_text = resp_json["content"][0]["text"]
    except (KeyError, IndexError, TypeError):
        try:
            # OpenAI-compatible format: { "choices": [{ "message": { "content": "..." } }] }
            result_text = resp_json["choices"][0]["message"]["content"]
        except (KeyError, IndexError, TypeError):
            try:
                # Flat format: { "text": "..." } or { "message": "..." }
                result_text = resp_json.get("text") or resp_json.get("message") or resp_json.get("content", "")
                if isinstance(result_text, list):
                    result_text = result_text[0].get("text", "") if result_text else ""
            except (AttributeError, IndexError, TypeError):
                import logging
                logging.getLogger("feedback").warning(f"Unexpected API response structure: {list(resp_json.keys())}")
                raise ValueError(f"Cannot extract text from API response (keys: {list(resp_json.keys())})")

    # Strip markdown code blocks if present
    result_text = result_text.strip()
    if result_text.startswith("```"):
        result_text = result_text.split("\n", 1)[1]
    if result_text.endswith("```"):
        result_text = result_text.rsplit("```", 1)[0]
    result = json.loads(result_text.strip())

    ai_themes = {item.get("theme"): item for item in result.get("themes", [])}
    theme_counts = Counter(classify_feedback_theme(message) for message in messages)
    themes = []
    for theme, count in theme_counts.items():
        ai_theme = ai_themes.get(theme, {})
        severity = "high" if count >= 5 else "medium" if count >= 3 else "low"
        themes.append(FeedbackTheme(
            theme=theme,
            severity=severity,
            fixSuggestion=ai_theme.get("fixSuggestion") or _generate_mock_fix(theme),
            messageCount=count,
        ))
    logs = [
        TraceLog(timestamp="00:00.300", type="action", text="Called custom LLM API for analysis"),
        TraceLog(timestamp="00:01.200", type="reasoning", text=f"LLM identified {len(themes)} themes"),
    ]

    return FeedbackInsights(themes=themes, totalMessages=len(messages)), logs


def _mock_analysis(messages: list[str]) -> tuple[FeedbackInsights, list[TraceLog]]:
    """Keyword-based analysis for mock mode."""
    theme_counts: dict[str, dict] = {}
    logs: list[TraceLog] = []

    for msg in messages:
        theme = classify_feedback_theme(msg)

        if theme not in theme_counts:
            theme_counts[theme] = {"count": 0, "messages": []}
        theme_counts[theme]["count"] += 1
        theme_counts[theme]["messages"].append(msg)

    logs.append(TraceLog(timestamp="00:00.500", type="action", text=f"Classified {len(messages)} messages into {len(theme_counts)} themes"))

    themes = []
    for theme_name, data in theme_counts.items():
        severity = "medium" if data["count"] >= 3 else "low"
        fix = _generate_mock_fix(theme_name)
        themes.append(FeedbackTheme(
            theme=theme_name, severity=severity,
            fixSuggestion=fix, messageCount=data["count"]
        ))

    themes.sort(key=lambda t: {"high": 0, "medium": 1, "low": 2}[t.severity])
    logs.append(TraceLog(timestamp="00:01.200", type="reasoning", text="Calculated severity based on mention frequency"))

    return FeedbackInsights(themes=themes, totalMessages=len(messages)), logs


def _generate_mock_fix(theme: str) -> str:
    fixes = {
        "delivery": "Consider adding real-time tracking and proactive delay notifications.",
        "pricing": "Review competitor pricing and consider value bundles.",
        "quality": "Implement stricter QA checks before shipping.",
        "service": "Add customer service training and response time SLAs.",
        "other": "Review feedback for emerging patterns.",
    }
    return fixes.get(theme, fixes["other"])
