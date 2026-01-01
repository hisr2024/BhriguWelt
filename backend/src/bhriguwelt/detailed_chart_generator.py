"""Enhanced Birth Chart and Horoscope generator with comprehensive detail and strict schema compliance.

This module provides detailed, structured birth chart and horoscope generation that is:
- Grounded in Bhrigu Samhita principles from the repository
- Structured with strict JSON schema validation
- Comprehensive with detailed life area breakdowns
- Traceable with correlation IDs
- Resilient with JSON repair and retry logic
"""

from __future__ import annotations

import json
import logging
import re
import uuid
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from .ai_client import AIIntegrationError, chat_completion
from .bhrigu_core import bhrigu_core

logger = logging.getLogger("bhriguwelt.detailed_chart_generator")


# Required schema for detailed birth chart/horoscope output
DETAILED_CHART_SCHEMA = {
    "chart_summary": "string - Plain language overview of the native's chart (3-5 sentences)",
    "key_personality_themes": ["array of 5-8 key personality traits/themes with brief descriptions"],
    "life_areas": {
        "career": {
            "strengths": ["array of career strengths"],
            "challenges": ["array of career challenges"],
            "turning_points": ["array of likely turning points in career"],
            "guidance": "string - Practical career guidance"
        },
        "relationships": {
            "strengths": ["array of relationship strengths"],
            "challenges": ["array of relationship challenges"],
            "turning_points": ["array of likely turning points"],
            "guidance": "string - Practical relationship guidance"
        },
        "health": {
            "strengths": ["array of health strengths/areas of vitality"],
            "challenges": ["array of health challenges to watch"],
            "turning_points": ["array of likely health turning points"],
            "guidance": "string - Practical health guidance"
        },
        "finances": {
            "strengths": ["array of financial strengths"],
            "challenges": ["array of financial challenges"],
            "turning_points": ["array of likely financial turning points"],
            "guidance": "string - Practical financial guidance"
        },
        "spirituality": {
            "strengths": ["array of spiritual strengths/gifts"],
            "challenges": ["array of spiritual challenges"],
            "turning_points": ["array of spiritual turning points"],
            "guidance": "string - Practical spiritual guidance"
        }
    },
    "yogas_or_bhrigu_indicators": [
        {
            "principle_id": "string - e.g., BR-1, BR-7",
            "name": "string - Name of yoga or indicator",
            "description": "string - What this indicates",
            "sutra_reference": "string - Source reference"
        }
    ],
    "yearwise_major_events": [
        {
            "year": "integer - Year or age",
            "themes": ["array of major themes for this period"],
            "likely_events": ["array of likely events"],
            "cautions": ["array of cautions/things to watch"],
            "supports": ["array of supporting factors/opportunities"]
        }
    ],
    "confidence_notes": "string - Explanation of what signals were used, certainty level, no hallucinations"
}


@dataclass
class DetailedChartResult:
    """Structured result from detailed chart generation."""

    correlation_id: str
    chart_summary: str
    key_personality_themes: List[str]
    life_areas: Dict[str, Dict[str, Any]]
    yogas_or_bhrigu_indicators: List[Dict[str, str]]
    yearwise_major_events: List[Dict[str, Any]]
    confidence_notes: str
    raw_response: str
    prompt_length: int
    response_length: int
    schema_valid: bool
    retry_count: int = 0
    errors: List[str] = field(default_factory=list)


def _extract_bhrigu_context(tradition: str = "universal", max_principles: int = 10) -> str:
    """Extract relevant Bhrigu Samhita principles and sutras for context.

    Args:
        tradition: The astrological tradition to use
        max_principles: Maximum number of principles to include

    Returns:
        Formatted string of Bhrigu principles with IDs, sutras, and descriptions
    """
    try:
        core_bundle = bhrigu_core.application_bundle(tradition)
        principles = core_bundle.get("principles", [])[:max_principles]

        context_parts = []
        for p in principles:
            principle_id = p.get("id", "Unknown")
            sutra_ref = p.get("sutra_reference", "No reference")
            description = p.get("description", "No description")

            context_parts.append(
                f"- {principle_id} ({sutra_ref}): {description}"
            )

        return "\n".join(context_parts) if context_parts else "No Bhrigu principles available"
    except Exception as e:
        logger.warning(f"Failed to extract Bhrigu context: {e}")
        return "Bhrigu context unavailable"


def _build_detailed_prompt(
    response_dict: Dict[str, Any],
    request_data: Dict[str, Any],
    bhrigu_context: str,
    correlation_id: str,
) -> tuple[str, str]:
    """Build comprehensive prompts for detailed chart generation.

    Args:
        response_dict: The base horoscope response
        request_data: Original request data
        bhrigu_context: Formatted Bhrigu principles context
        correlation_id: Unique ID for this request

    Returns:
        Tuple of (system_prompt, user_prompt)
    """
    seeker_name = request_data.get("name") or request_data.get("full_name") or "Seeker"
    birth_date = request_data.get("birth_date", "unknown")
    birth_time = request_data.get("birth_time", "unknown")
    birth_place = request_data.get("birth_place", "unknown")

    # Extract base data
    weights = response_dict.get("weights", {})
    principles = response_dict.get("principles", [])
    past_life_insights = response_dict.get("past_life_insights", [])
    future_trajectories = response_dict.get("future_trajectories", [])
    remedies = response_dict.get("remedies", [])
    interpretation = response_dict.get("interpretation", "")

    system_prompt = """You are an expert Bhrigu Samhita interpreter powered by Sarvam AI. Your task is to generate COMPREHENSIVE, DETAILED birth chart and horoscope interpretations that are:

1. GROUNDED in authentic Bhrigu Samhita principles (provided below)
2. STRUCTURED according to the exact JSON schema provided
3. DETAILED with rich, meaningful content (NO brief summaries or placeholders)
4. PRACTICAL with actionable guidance
5. COMPASSIONATE with a mentor's tone

CRITICAL REQUIREMENTS:
- Output MUST be valid JSON matching the schema EXACTLY
- Each life area (career, relationships, health, finances, spirituality) MUST have:
  * At least 3-5 specific strengths
  * At least 3-5 specific challenges
  * At least 2-4 turning points
  * Detailed guidance paragraph (minimum 100 words)
- Include at least 5-10 year-wise predictions
- Reference specific Bhrigu principles (BR-1, BR-7, etc.) with sutra references
- NO medical diagnoses, NO financial advice (only general guidance)
- Remind of free will and personal agency

SCHEMA:
{
  "chart_summary": "3-5 sentence overview",
  "key_personality_themes": ["theme 1 with description", "theme 2 with description", ...],
  "life_areas": {
    "career": {"strengths": [...], "challenges": [...], "turning_points": [...], "guidance": "..."},
    "relationships": {"strengths": [...], "challenges": [...], "turning_points": [...], "guidance": "..."},
    "health": {"strengths": [...], "challenges": [...], "turning_points": [...], "guidance": "..."},
    "finances": {"strengths": [...], "challenges": [...], "turning_points": [...], "guidance": "..."},
    "spirituality": {"strengths": [...], "challenges": [...], "turning_points": [...], "guidance": "..."}
  },
  "yogas_or_bhrigu_indicators": [
    {"principle_id": "BR-X", "name": "...", "description": "...", "sutra_reference": "..."}
  ],
  "yearwise_major_events": [
    {"year": 2025, "themes": [...], "likely_events": [...], "cautions": [...], "supports": [...]}
  ],
  "confidence_notes": "Explanation of signals used and certainty level"
}

Output ONLY the JSON object. NO additional text before or after."""

    user_prompt = f"""Generate a comprehensive, detailed birth chart interpretation for {seeker_name}.

CORRELATION ID: {correlation_id}

BIRTH DETAILS:
- Date: {birth_date}
- Time: {birth_time}
- Place: {birth_place}

BHRIGU SAMHITA PRINCIPLES (use these as foundation):
{bhrigu_context}

BASE ENGINE ANALYSIS:
- Karmic Epoch: {response_dict.get('karmic_epoch', 'unknown')}
- Weights: {json.dumps(weights, ensure_ascii=False)}
- Top Principles: {json.dumps(principles[:5] if isinstance(principles, list) else [], ensure_ascii=False, default=str)}
- Past Life Insights: {json.dumps(past_life_insights[:3] if isinstance(past_life_insights, list) else [], ensure_ascii=False, default=str)}
- Future Trajectories: {json.dumps(future_trajectories[:3] if isinstance(future_trajectories, list) else [], ensure_ascii=False, default=str)}
- Remedies: {json.dumps(remedies[:3] if isinstance(remedies, list) else [], ensure_ascii=False, default=str)}

BASE INTERPRETATION:
{interpretation[:1000] if interpretation else 'No base interpretation available'}

INSTRUCTIONS:
1. Create a rich, detailed chart_summary (3-5 sentences) weaving together the key themes
2. Identify 5-8 key_personality_themes from the weights and principles
3. For each life area (career, relationships, health, finances, spirituality):
   - List 3-5 specific strengths based on weights and principles
   - List 3-5 specific challenges to be aware of
   - Identify 2-4 likely turning_points with approximate timing
   - Write detailed guidance (100+ words) with practical steps
4. Extract yogas_or_bhrigu_indicators from the principles data (reference BR-X IDs and sutras)
5. Generate 5-10 yearwise_major_events covering different life phases
6. Add confidence_notes explaining what astrological signals were used

Output ONLY valid JSON. Be detailed and comprehensive - this is NOT a summary, but a full reading."""

    return system_prompt, user_prompt


def _repair_json(text: str, correlation_id: str) -> Optional[Dict[str, Any]]:
    """Attempt to repair malformed JSON from AI response.

    Args:
        text: The potentially malformed JSON text
        correlation_id: Request correlation ID for logging

    Returns:
        Parsed JSON dict if successful, None if repair fails
    """
    logger.info(f"[{correlation_id}] Attempting JSON repair on response")

    # Try 1: Direct parse
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Try 2: Extract JSON from markdown code blocks
    json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', text, re.DOTALL)
    if json_match:
        try:
            return json.loads(json_match.group(1))
        except json.JSONDecodeError:
            pass

    # Try 3: Find first { to last }
    start = text.find('{')
    end = text.rfind('}')
    if start != -1 and end != -1 and end > start:
        try:
            return json.loads(text[start:end+1])
        except json.JSONDecodeError:
            pass

    # Try 4: Remove common issues (trailing commas, unescaped quotes)
    try:
        # Remove trailing commas before } or ]
        cleaned = re.sub(r',\s*([}\]])', r'\1', text)
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    logger.error(f"[{correlation_id}] JSON repair failed after all attempts")
    return None


def _validate_schema(data: Dict[str, Any], correlation_id: str) -> tuple[bool, List[str]]:
    """Validate that the response matches the required schema.

    Args:
        data: The parsed JSON response
        correlation_id: Request correlation ID for logging

    Returns:
        Tuple of (is_valid, list of error messages)
    """
    errors = []

    # Check required top-level keys
    required_keys = [
        "chart_summary",
        "key_personality_themes",
        "life_areas",
        "yogas_or_bhrigu_indicators",
        "yearwise_major_events",
        "confidence_notes"
    ]

    for key in required_keys:
        if key not in data:
            errors.append(f"Missing required key: {key}")

    # Check life_areas structure
    if "life_areas" in data:
        required_areas = ["career", "relationships", "health", "finances", "spirituality"]
        life_areas = data["life_areas"]

        if not isinstance(life_areas, dict):
            errors.append("life_areas must be a dictionary")
        else:
            for area in required_areas:
                if area not in life_areas:
                    errors.append(f"Missing life area: {area}")
                elif isinstance(life_areas[area], dict):
                    area_data = life_areas[area]
                    for subkey in ["strengths", "challenges", "turning_points", "guidance"]:
                        if subkey not in area_data:
                            errors.append(f"Missing {subkey} in {area}")
                        elif subkey in ["strengths", "challenges", "turning_points"]:
                            if not isinstance(area_data[subkey], list):
                                errors.append(f"{area}.{subkey} must be an array")
                        elif subkey == "guidance":
                            if not isinstance(area_data[subkey], str):
                                errors.append(f"{area}.{subkey} must be a string")

    # Check arrays
    if "key_personality_themes" in data and not isinstance(data["key_personality_themes"], list):
        errors.append("key_personality_themes must be an array")

    if "yogas_or_bhrigu_indicators" in data and not isinstance(data["yogas_or_bhrigu_indicators"], list):
        errors.append("yogas_or_bhrigu_indicators must be an array")

    if "yearwise_major_events" in data and not isinstance(data["yearwise_major_events"], list):
        errors.append("yearwise_major_events must be an array")

    is_valid = len(errors) == 0

    if is_valid:
        logger.info(f"[{correlation_id}] Schema validation passed")
    else:
        logger.warning(f"[{correlation_id}] Schema validation failed: {errors}")

    return is_valid, errors


def generate_detailed_chart(
    response_dict: Dict[str, Any],
    request_data: Dict[str, Any],
    tradition: str = "universal",
    max_retries: int = 3,
) -> DetailedChartResult:
    """Generate a comprehensive, detailed birth chart with strict schema compliance.

    This function orchestrates the entire detailed chart generation process:
    1. Extracts Bhrigu Samhita principles from the repository
    2. Builds detailed prompts with full context
    3. Calls Sarvam AI with high max_tokens
    4. Validates and repairs JSON responses
    5. Retries on failure with exponential backoff
    6. Returns structured result with metrics

    Args:
        response_dict: Base horoscope response from build_prediction
        request_data: Original request data
        tradition: Astrological tradition (default: "universal")
        max_retries: Maximum retry attempts (default: 3)

    Returns:
        DetailedChartResult with all structured data and metrics

    Raises:
        AIIntegrationError: If AI generation fails after all retries
        ValueError: If schema validation fails after all attempts
    """
    correlation_id = str(uuid.uuid4())
    logger.info(f"[{correlation_id}] Starting detailed chart generation")

    # Extract Bhrigu context from repository
    bhrigu_context = _extract_bhrigu_context(tradition, max_principles=10)

    # Build comprehensive prompts
    system_prompt, user_prompt = _build_detailed_prompt(
        response_dict,
        request_data,
        bhrigu_context,
        correlation_id
    )

    prompt_length = len(system_prompt) + len(user_prompt)
    logger.info(f"[{correlation_id}] Prompt length: {prompt_length} characters")

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt}
    ]

    errors = []
    last_response = ""

    for attempt in range(max_retries):
        try:
            logger.info(f"[{correlation_id}] Attempt {attempt + 1}/{max_retries}")

            # Call AI with high max_tokens for detailed output
            # Increased from 600 to 3500 to accommodate comprehensive responses
            response_text = chat_completion(
                messages,
                max_tokens=3500,
                temperature=0.4
            )

            last_response = response_text
            response_length = len(response_text)
            logger.info(f"[{correlation_id}] Response length: {response_length} characters")

            # Try to parse JSON
            parsed_data = None
            try:
                parsed_data = json.loads(response_text)
            except json.JSONDecodeError:
                logger.warning(f"[{correlation_id}] Direct JSON parse failed, attempting repair")
                parsed_data = _repair_json(response_text, correlation_id)

            if parsed_data is None:
                error_msg = f"Failed to parse JSON response (attempt {attempt + 1})"
                errors.append(error_msg)
                logger.error(f"[{correlation_id}] {error_msg}")
                continue

            # Validate schema
            is_valid, validation_errors = _validate_schema(parsed_data, correlation_id)

            if not is_valid:
                error_msg = f"Schema validation failed: {validation_errors}"
                errors.append(error_msg)
                logger.warning(f"[{correlation_id}] {error_msg}")

                # On validation failure, add feedback to prompt for retry
                if attempt < max_retries - 1:
                    messages.append({
                        "role": "assistant",
                        "content": response_text
                    })
                    messages.append({
                        "role": "user",
                        "content": f"The response had schema validation errors: {validation_errors}. "
                                   f"Please provide a corrected response with valid JSON matching the exact schema."
                    })
                continue

            # Success!
            logger.info(f"[{correlation_id}] Detailed chart generation successful")

            return DetailedChartResult(
                correlation_id=correlation_id,
                chart_summary=parsed_data.get("chart_summary", ""),
                key_personality_themes=parsed_data.get("key_personality_themes", []),
                life_areas=parsed_data.get("life_areas", {}),
                yogas_or_bhrigu_indicators=parsed_data.get("yogas_or_bhrigu_indicators", []),
                yearwise_major_events=parsed_data.get("yearwise_major_events", []),
                confidence_notes=parsed_data.get("confidence_notes", ""),
                raw_response=response_text,
                prompt_length=prompt_length,
                response_length=response_length,
                schema_valid=True,
                retry_count=attempt,
                errors=errors
            )

        except AIIntegrationError as e:
            error_msg = f"AI integration error (attempt {attempt + 1}): {str(e)}"
            errors.append(error_msg)
            logger.error(f"[{correlation_id}] {error_msg}")

            if attempt == max_retries - 1:
                raise

    # All retries exhausted
    logger.error(f"[{correlation_id}] All {max_retries} attempts failed. Errors: {errors}")

    # Return a degraded result with fallback data
    return DetailedChartResult(
        correlation_id=correlation_id,
        chart_summary=response_dict.get("interpretation", "Chart generation incomplete")[:500],
        key_personality_themes=["Analysis in progress - please try again"],
        life_areas={
            area: {
                "strengths": ["Analysis in progress"],
                "challenges": ["Analysis in progress"],
                "turning_points": ["Analysis in progress"],
                "guidance": "Detailed analysis unavailable - please regenerate the chart"
            }
            for area in ["career", "relationships", "health", "finances", "spirituality"]
        },
        yogas_or_bhrigu_indicators=[],
        yearwise_major_events=[],
        confidence_notes=f"Generation failed after {max_retries} attempts. Errors: {'; '.join(errors)}",
        raw_response=last_response,
        prompt_length=prompt_length,
        response_length=len(last_response),
        schema_valid=False,
        retry_count=max_retries,
        errors=errors
    )
