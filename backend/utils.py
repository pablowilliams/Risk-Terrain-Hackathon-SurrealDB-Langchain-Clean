from __future__ import annotations
"""
Shared Utilities — Fix #28 #29 #60-62 #63 #85
Central place for Claude API helpers, retry logic, code-fence stripping, request IDs.
"""

import json
import re
import time
import uuid
import logging
from functools import wraps
from anthropic import Anthropic, APIError, RateLimitError, APIConnectionError
from config import settings

logger = logging.getLogger("riskterrain.utils")

# Fix #85: request correlation ID (set per pipeline invocation)
_current_request_id: str = ""


def new_request_id() -> str:
    global _current_request_id
    _current_request_id = uuid.uuid4().hex[:8]
    return _current_request_id


def get_request_id() -> str:
    return _current_request_id


# Fix #9: lazy client init (not at import time, avoids #8 cascade)
_client: Anthropic | None = None


def get_claude_client() -> Anthropic:
    """Lazy-init Anthropic client. Fix #9: not at module import time."""
    global _client
    if _client is None:
        _client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    return _client


# Fix #28 #29: robust code-fence stripping (handles ```json, ```JSON, multiple fences)
def strip_code_fences(text: str) -> str:
    """Remove markdown code fences from Claude responses."""
    text = text.strip()
    # Handle ```json ... ``` or ```JSON ... ``` or ``` ... ```
    pattern = r"^```(?:json|JSON|surql|python)?\s*\n?(.*?)\n?\s*```$"
    match = re.match(pattern, text, re.DOTALL)
    if match:
        return match.group(1).strip()
    # Handle leading ``` without closing
    if text.startswith("```"):
        lines = text.split("\n", 1)
        text = lines[1] if len(lines) > 1 else text[3:]
    if text.endswith("```"):
        text = text[:-3]
    return text.strip()


# Fix #60-62 #63: shared Claude call with retry
def call_claude(system: str, user_content: str, max_tokens: int = 500,
                temperature: float = 0, max_retries: int = 2) -> str:
    """
    Call Claude API with retry logic for rate limits and transient errors.
    Returns the raw text response.
    """
    client = get_claude_client()
    rid = get_request_id()

    for attempt in range(max_retries + 1):
        try:
            response = client.messages.create(
                model=settings.CLAUDE_MODEL,
                max_tokens=max_tokens,
                temperature=temperature,
                system=system,
                messages=[{"role": "user", "content": user_content}],
            )
            raw = response.content[0].text.strip()
            return strip_code_fences(raw)

        except RateLimitError as e:
            wait = min(2 ** attempt * 2, 30)
            logger.warning(f"[{rid}] Claude rate limit (attempt {attempt+1}), waiting {wait}s")
            if attempt < max_retries:
                time.sleep(wait)
            else:
                raise
        except APIConnectionError as e:
            wait = min(2 ** attempt, 10)
            logger.warning(f"[{rid}] Claude connection error (attempt {attempt+1}): {e}")
            if attempt < max_retries:
                time.sleep(wait)
            else:
                raise
        except APIError as e:
            if e.status_code and e.status_code >= 500 and attempt < max_retries:
                time.sleep(2)
                continue
            raise

    raise RuntimeError("Claude call failed after retries")


def parse_claude_json(text: str, fallback: dict | None = None) -> dict:
    """Parse JSON from Claude response with fallback. Fix #57: catches ValueError too."""
    cleaned = strip_code_fences(text)
    try:
        return json.loads(cleaned)
    except (json.JSONDecodeError, ValueError):
        logger.error(f"JSON parse failed: {cleaned[:200]}")
        return fallback or {}


# Fix #88: input sanitisation
def sanitise_input(text: str, max_length: int = 2000) -> str:
    """Truncate and clean user input."""
    return text.strip()[:max_length]


# Fix #11: safe SurrealDB record ID
def safe_surreal_id(ticker: str) -> str:
    """Convert ticker to safe SurrealDB record ID component. Fix #11 #12."""
    return re.sub(r"[^A-Za-z0-9_]", "_", ticker)
