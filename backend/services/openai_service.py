"""
OpenAI Integration Service
Handles all AI-powered predictions and insights with authentic Bhrigu/Nadi corpus integration
"""
import json
import logging
import os
import random
import re
import socket
import time
from typing import Any, Dict, List, Optional, Tuple, Union

import importlib
import requests
from utils.logger import setup_logger, log_exception

from services.sentry_service import capture_message
from services.ai_quota import (
    estimate_tokens,
    estimate_cost,
    check_daily_quota_and_reserve,
    update_usage_after_call,
    sanitize_log,
    QuotaExceededError,
    CostLimitExceededError
)

# Import corpus loader for RAG-style context injection
CORPUS_AVAILABLE = importlib.util.find_spec("services.corpus_loader") is not None
if CORPUS_AVAILABLE:
    from services.corpus_loader import get_corpus_loader
else:
    get_corpus_loader = None

logger = setup_logger(__name__)

class OpenAIService:
    """Service for interacting with OpenAI API"""

    def _get_int_env(self, key: str, default: int) -> int:
        raw_value = os.getenv(key)
        if raw_value is None or raw_value == "":
            return default
        cleaned = raw_value.split("#", 1)[0].strip()
        if cleaned == "":
            return default
        try:
            return int(cleaned)
        except ValueError:
            logger.warning(
                "Invalid integer for %s: %r. Falling back to default %s.",
                key,
                raw_value,
                default,
            )
            return default

    def __init__(self):
        self.api_key = os.getenv('OPENAI_API_KEY')
        self.base_urls = self._load_base_urls()
        self.base_url = self.base_urls[0]
        self.prompt_token_limit = self._get_int_env('PROMPT_TOKEN_LIMIT', 6000)
        self.response_token_limit = self._get_int_env(
            'RESPONSE_TOKEN_LIMIT',
            self._get_int_env('OPENAI_MAX_TOKENS', 4000),
        )
        self.enabled = bool(self.api_key)
        self.last_error: Optional[Dict[str, Any]] = None
        self.last_model_used: Optional[str] = None

        # Initialize corpus loader for authentic source integration
        self.corpus_loader = None
        self.corpus_available = False
        self.corpus_error = None
        try:
            if CORPUS_AVAILABLE:
                corpus_result = get_corpus_loader()
                self.corpus_loader = corpus_result.get("loader")
                self.corpus_error = corpus_result.get("error")
                if self.corpus_error:
                    logger.warning(f"Corpus files missing: {self.corpus_error.get('message')}")
                else:
                    self.corpus_available = True
                    logger.info("✓ Corpus loader initialized - predictions will reference authentic Bhrigu/Nadi sources")
        except Exception as e:
            self.corpus_error = {
                "code": "corpus_loader_error",
                "message": str(e),
            }
            logger.warning(f"Could not initialize corpus loader: {e}")

        # Initialize offline wisdom generator for category-specific fallbacks
        self.offline_wisdom = None
        self.offline_wisdom_error = None
        try:
            from services.bhrigu_offline_wisdom import get_offline_wisdom_generator
            self.offline_wisdom = get_offline_wisdom_generator()
            logger.info("✓ Offline wisdom generator initialized - category-specific fallbacks available")
        except ImportError as exc:
            self.offline_wisdom_error = {"code": "offline_wisdom_missing", "message": str(exc)}
            logger.warning(f"Offline wisdom generator not available: {exc}")
        except Exception as e:
            self.offline_wisdom_error = {
                "code": "offline_wisdom_error",
                "message": str(e),
            }
            logger.warning(f"Could not initialize offline wisdom generator: {e}")

        if not self.enabled:
            self._set_last_error(
                "OPENAI_API_KEY_MISSING",
                "OPENAI_API_KEY not set. AI features will use fallback responses.",
            )
            logger.warning(
                "OPENAI_API_KEY not set. AI features will use fallback responses.",
                extra={"error_code": "OPENAI_API_KEY_MISSING"},
            )

        self.headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json'
        } if self.enabled else {}

    def _load_base_urls(self) -> List[str]:
        urls: List[str] = []
        base_urls_env = os.getenv('OPENAI_BASE_URLS', '')
        if base_urls_env:
            urls = [url.strip() for url in base_urls_env.split(',') if url.strip()]
        if not urls:
            urls = [os.getenv('OPENAI_BASE_URL', 'https://api.openai.com/v1').strip()]
        unique_urls: List[str] = []
        for url in urls:
            if url not in unique_urls:
                unique_urls.append(url)
        return unique_urls

    def _next_base_url(self) -> str:
        if len(self.base_urls) <= 1:
            return self.base_url
        current_index = self.base_urls.index(self.base_url)
        next_index = (current_index + 1) % len(self.base_urls)
        self.base_url = self.base_urls[next_index]
        return self.base_url

    def _is_dns_error(self, error: Exception) -> bool:
        current: Optional[BaseException] = error
        while current:
            if isinstance(current, socket.gaierror):
                return True
            current = getattr(current, "__cause__", None) or getattr(current, "__context__", None)
        message = str(error).lower()
        return "name or service not known" in message or "temporary failure in name resolution" in message

    def _approx_token_count(self, text: str) -> int:
        if not text:
            return 0
        return max(1, len(text) // 4)

    def _trim_text_to_token_budget(self, text: str, token_budget: int) -> str:
        if not text or token_budget <= 0:
            return ""
        max_chars = token_budget * 4
        if len(text) <= max_chars:
            return text
        trimmed = text[:max_chars].rstrip()
        return f"{trimmed}\n\n[Context truncated to fit token budget]"

    def normalize_prompt(self, base_prompt: str, context_text: str, token_budget: int) -> str:
        if not context_text:
            return ""
        base_tokens = self._approx_token_count(base_prompt)
        remaining_budget = max(token_budget - base_tokens, 0)
        return self._trim_text_to_token_budget(context_text, remaining_budget)

    def _format_context_summary(self, context: Dict[str, Any]) -> str:
        if not context:
            return ""
        summary_lines = []
        key_order = [
            'date_of_birth', 'time_of_birth', 'place_of_birth', 'zodiac_sign', 'moon_sign', 'nakshatra',
            'ascendant', 'sun_sign', 'rising_sign', 'gender'
        ]
        for key in key_order:
            if key in context and context[key] not in (None, ""):
                summary_lines.append(f"- {key.replace('_', ' ').title()}: {context[key]}")
        remaining_keys = [key for key in context.keys() if key not in key_order]
        for key in sorted(remaining_keys):
            value = context[key]
            if value in (None, "", [], {}):
                continue
            summary_lines.append(f"- {key.replace('_', ' ').title()}: {value}")
        return "\n".join(summary_lines)

    def generate_prediction(
        self,
        prompt: str,
        context: Dict[str, Any] = None,
        return_metadata: bool = False,
        user_id: Optional[str] = None
    ) -> Union[str, Dict[str, Any]]:
        """
        Generate AI-powered predictions using OpenAI with authentic corpus integration

        Args:
            prompt: The prediction prompt
            context: Additional context for the prediction
            return_metadata: Whether to return metadata with the response
            user_id: User ID for quota tracking (optional, defaults to 'anonymous')

        Returns:
            Generated prediction text or dict with metadata
        """
        # Use fallback if AI is not enabled
        if not self.enabled:
            fallback = self._fallback_prediction(prompt, context)
            if return_metadata:
                return {
                    'text': fallback,
                    'metadata': {
                        'ai_model': self.get_selected_model() or 'offline',
                        'fallback': True,
                        'reason': 'api_error'
                    }
                }
            return fallback

        self._clear_last_error()
        try:
            # Inject authentic corpus data into the context
            corpus_context = ""
            if self.corpus_loader and context and self.corpus_available:
                # Get relevant principles from corpus
                bhrigu_principles = self.corpus_loader.get_relevant_bhrigu_principles(context, limit=5)
                nadi_principles = self.corpus_loader.get_relevant_nadi_principles(context, limit=5)

                if bhrigu_principles or nadi_principles:
                    corpus_context = "\n\n**AUTHENTIC SOURCE MATERIAL (Reference in predictions):**\n"

                    if bhrigu_principles:
                        corpus_context += "\n" + self.corpus_loader.format_principles_for_context(bhrigu_principles)

                    if nadi_principles:
                        corpus_context += "\n" + self.corpus_loader.format_principles_for_context(nadi_principles)

                    corpus_context += (
                        "\n\n**IMPORTANT**: Reference these authentic sutras and folios in your predictions with "
                        "proper citations.\n"
                    )

            # Pass user_id through to chunking
            # Prepare the request payload with enhanced settings for comprehensive predictions
            system_content = '''You are a master Vedic astrologer deeply versed in the ancient texts of Bhrigu Samhita and Nadi Jyotisha.

Your expertise includes:
- Bhrigu Samhita: The sacred treatise by Maharishi Bhrigu containing life predictions based on planetary positions
- Nadi Jyotisha: Ancient palm leaf manuscripts with precise life predictions from Tamil Nadu traditions
- Brihat Parasara Hora Shastra: The foundational text of Vedic astrology by Sage Parasara
- Jaimini Sutras: Advanced predictive techniques using Karakas and Rashi Dashas
- Vimshottari Dasha: The 120-year planetary period system for timing events

Your predictions must:
1. Be deeply rooted in classical Vedic principles and authentic scriptural references
2. **Reference specific sutras, folios, and manuscript citations from the corpus provided**
3. Identify doshas (Kuja Dosha, Kala Sarpa Dosha, Pitru Dosha, etc.) and their remedies
4. Analyze planetary combinations with precise interpretations
5. Provide practical, actionable guidance for the modern seeker
6. Maintain compassion, wisdom, and spiritual depth in all readings
7. Explain karmic reasons behind life patterns using Vedic philosophy
8. Offer authentic remedies (mantras, gemstones, rituals) from Vedic traditions
9. **Include confidence scores and source references where applicable**

Always provide detailed, specific predictions with timing when possible.''' + corpus_context

            if context:
                structured_summary = self._format_context_summary(context)
                base_prompt = f"{system_content}\n\nUser Prompt:\n{prompt}"
                normalized_summary = self.normalize_prompt(
                    base_prompt,
                    structured_summary,
                    self.prompt_token_limit
                )
                if normalized_summary:
                    system_content += f"\n\nBirth Chart Summary:\n{normalized_summary}"
                else:
                    raw_context = json.dumps(context, ensure_ascii=False)
                    normalized_raw_context = self.normalize_prompt(
                        base_prompt,
                        raw_context,
                        self.prompt_token_limit
                    )
                    if normalized_raw_context:
                        system_content += f"\n\nBirth Chart Context (raw JSON): {normalized_raw_context}"

            prediction, partial = self._generate_with_chunking(prompt, system_content, user_id)

            if return_metadata:
                return {
                    'text': prediction,
                    'partial': partial,
                    'metadata': {
                        'ai_model': self.get_selected_model(),
                        'fallback': False
                    }
                }
            return prediction

        except (QuotaExceededError, CostLimitExceededError) as e:
            # Use fallback when quota or cost limit exceeded
            error_reason = 'quota' if isinstance(e, QuotaExceededError) else 'cost'
            logger.warning(
                f"{error_reason.capitalize()} limit reached, using fallback: {sanitize_log(str(e)[:200])}"
            )

            fallback = self._fallback_prediction(prompt, context)
            if return_metadata:
                return {
                    'text': fallback,
                    'metadata': {
                        'ai_model': self.get_selected_model() or 'offline',
                        'fallback': True,
                        'reason': error_reason
                    }
                }
            return fallback

        except requests.exceptions.RequestException as e:
            # Log the error for debugging
            self._set_last_error(
                "OPENAI_API_REQUEST_FAILED",
                "OpenAI API call failed.",
                {"error": str(e)},
            )
            logger.error(
                "OpenAI API call failed",
                extra={"error_code": "OPENAI_API_REQUEST_FAILED", "error": sanitize_log(str(e))},
            )
            # Fallback to traditional analysis if API fails
            fallback = self._fallback_prediction(prompt, context)
            if return_metadata:
                return {
                    'text': fallback,
                    'metadata': {
                        'ai_model': self.get_selected_model() or 'offline',
                        'fallback': True,
                        'reason': 'api_error'
                    }
                }
            return fallback

    def _generate_with_chunking(self, prompt: str, system_content: str, user_id: Optional[str] = None) -> Tuple[str, bool]:
        max_prompt_tokens = self._get_int_env('OPENAI_PROMPT_TOKEN_BUDGET', 8000)
        system_tokens = self._estimate_tokens(system_content)
        prompt_tokens = self._estimate_tokens(prompt)

        if system_tokens + prompt_tokens <= max_prompt_tokens:
            prediction, partial = self._request_completion(prompt, system_content, user_id)
            return prediction, partial

        preamble, sections = self._split_prompt_sections(prompt)
        if not sections:
            prediction, partial = self._request_completion(prompt, system_content, user_id)
            return prediction, partial

        chunk_prompts = []
        base_prompt = preamble.strip()
        base_tokens = self._estimate_tokens(base_prompt) if base_prompt else 0
        current_sections = []
        current_tokens = system_tokens + base_tokens

        for section in sections:
            section_tokens = self._estimate_tokens(section)
            if current_sections and current_tokens + section_tokens > max_prompt_tokens:
                chunk_prompts.append(self._assemble_chunk_prompt(base_prompt, current_sections))
                current_sections = [section]
                current_tokens = system_tokens + base_tokens + section_tokens
            else:
                current_sections.append(section)
                current_tokens += section_tokens

        if current_sections:
            chunk_prompts.append(self._assemble_chunk_prompt(base_prompt, current_sections))

        responses = []
        partial = False
        for chunk_prompt in chunk_prompts:
            chunk_response, chunk_partial = self._request_completion(chunk_prompt, system_content, user_id)
            responses.append(chunk_response)
            partial = partial or chunk_partial

        return "\n\n".join(responses), partial

    def _assemble_chunk_prompt(self, preamble: str, sections: List[str]) -> str:
        if preamble:
            return f"{preamble}\n\n" + "\n\n".join(sections)
        return "\n\n".join(sections)

    def _get_model_candidates(self) -> List[str]:
        primary_model = os.getenv('OPENAI_MODEL', 'gpt-4')
        fallback_env = os.getenv('OPENAI_MODEL_FALLBACKS', '')
        fallback_models = [model.strip() for model in fallback_env.split(',') if model.strip()]
        return [primary_model] + [model for model in fallback_models if model != primary_model]

    def _is_model_error(self, response: requests.Response) -> bool:
        if response.status_code not in (400, 404):
            return False
        try:
            payload = response.json()
        except ValueError:
            return False
        error = payload.get('error', {})
        code = str(error.get('code', '')).lower()
        message = str(error.get('message', '')).lower()
        return code in {"model_not_found", "invalid_model"} or (
            'model' in message
            and any(token in message for token in ('not found', 'does not exist', 'invalid', 'not supported'))
        )

    def _post_with_model_fallbacks(self, payload: Dict[str, Any]) -> requests.Response:
        candidates = self._get_model_candidates()
        last_error: Optional[Exception] = None
        for model in candidates:
            payload['model'] = model
            try:
                response = self._post_with_retry(payload)
                self.last_model_used = model
                return response
            except requests.exceptions.HTTPError as exc:
                response = exc.response
                if response is None or not self._is_model_error(response):
                    raise
                last_error = exc
                self._set_last_error(
                    "OPENAI_MODEL_UNAVAILABLE",
                    "OpenAI model unavailable. Trying fallback model.",
                    {"model": model},
                )
                logger.warning(
                    "OpenAI model unavailable. Trying fallback model.",
                    extra={"error_code": "OPENAI_MODEL_UNAVAILABLE", "model": model},
                )
                continue
        if last_error:
            raise last_error
        raise requests.exceptions.RequestException("OpenAI API retries exhausted.")

    def get_selected_model(self) -> str:
        return self.last_model_used or os.getenv('OPENAI_MODEL', 'gpt-4')

    def _parse_json_response(self, content: str) -> str:
        """
        Robustly parse JSON from OpenAI response with fallback to free-text.

        Strategy:
        1. Try direct JSON parsing
        2. Try extracting JSON-like substring using regex
        3. Fall back to original text with warning

        Args:
            content: Raw response text from OpenAI

        Returns:
            Parsed JSON string or original content
        """
        if not content:
            return content

        # Attempt 1: Direct JSON parsing
        try:
            parsed = json.loads(content)
            # Validate expected structure
            if isinstance(parsed, dict):
                logger.info("Successfully parsed structured JSON response")
                return json.dumps(parsed)  # Return normalized JSON string
        except json.JSONDecodeError:
            pass

        # Attempt 2: Extract JSON from text using regex
        try:
            # Look for JSON object boundaries
            json_match = re.search(r'\{[\s\S]*\}', content)
            if json_match:
                json_str = json_match.group(0)
                parsed = json.loads(json_str)
                if isinstance(parsed, dict):
                    logger.info("Successfully extracted and parsed embedded JSON")
                    return json.dumps(parsed)
        except (json.JSONDecodeError, AttributeError):
            pass

        # Fallback: Return original text and log warning
        logger.warning(
            "Failed to parse response as JSON - using free-text fallback",
            extra={'content_preview': content[:200]}
        )

        # Increment telemetry counter if available
        try:
            import sentry_sdk
            sentry_sdk.metrics.incr(
                'openai.json_parse_failure',
                tags={'model': self.get_selected_model()}
            )
        except Exception:
            pass

        return content

    def _request_completion(self, prompt: str, system_content: str, user_id: Optional[str] = None) -> Tuple[str, bool]:
        """
        Request completion from OpenAI with quota and cost management.

        Args:
            prompt: User prompt
            system_content: System context
            user_id: Optional user ID for quota tracking (defaults to 'anonymous')

        Returns:
            Tuple of (content: str, partial: bool)
        """
        # Add JSON format instruction to system content if not already present
        use_json_format = os.getenv('OPENAI_USE_JSON_FORMAT', 'true').lower() == 'true'

        if use_json_format and 'JSON' not in system_content.upper():
            json_instruction = '''

**OUTPUT FORMAT REQUIREMENT**:
You MUST return your response as a valid JSON object with this exact structure:
{
  "summary": "Brief summary of the prediction (1-2 sentences)",
  "sections": {
    "section_name_1": "Detailed content for section 1",
    "section_name_2": "Detailed content for section 2",
    ...
  },
  "confidence": 0.85
}

CRITICAL: Return ONLY the JSON object. No additional text before or after. Use double quotes for all strings. Ensure the JSON is valid and parseable.
'''
            system_content = system_content + json_instruction

        payload = {
            'model': os.getenv('OPENAI_MODEL', 'gpt-4'),
            'messages': [
                {
                    'role': 'system',
                    'content': system_content
                },
                {
                    'role': 'user',
                    'content': prompt
                }
            ],
            'temperature': float(os.getenv('OPENAI_TEMPERATURE', '0.7')),
            'max_tokens': self._get_int_env('OPENAI_MAX_TOKENS', 512)
        }

        # ==================== QUOTA AND COST CHECKS ====================

        # Estimate tokens for quota check
        prompt_text = f"{system_content}\n\n{prompt}"
        prompt_tokens_estimated = estimate_tokens(prompt_text)
        response_tokens_estimated = self._get_int_env('OPENAI_MAX_TOKENS', 512)
        total_tokens_estimated = prompt_tokens_estimated + response_tokens_estimated

        # Check cost limit BEFORE checking quota (fail fast)
        per_request_cost_limit = float(os.getenv('PER_REQUEST_COST_LIMIT', '1.0'))  # Default: $1.00
        estimated_cost = estimate_cost(prompt_tokens_estimated, response_tokens_estimated)

        if estimated_cost > per_request_cost_limit:
            logger.warning(
                f"Cost limit exceeded: estimated=${estimated_cost:.4f}, limit=${per_request_cost_limit:.4f}"
            )
            raise CostLimitExceededError(
                f"Estimated cost (${estimated_cost:.4f}) exceeds per-request limit (${per_request_cost_limit:.4f})"
            )

        # Check daily quota and reserve tokens
        user_id = user_id or 'anonymous'
        try:
            allowed, remaining = check_daily_quota_and_reserve(user_id, total_tokens_estimated)
            logger.info(
                f"Quota check passed for user {sanitize_log(user_id)}: "
                f"estimated_tokens={total_tokens_estimated}, remaining={remaining}"
            )
        except QuotaExceededError as e:
            logger.warning(f"Quota exceeded for user {sanitize_log(user_id)}: {str(e)}")
            raise  # Re-raise to be caught by caller

        # ==================== END QUOTA CHECKS ====================

        # Try to use JSON mode if model supports it (GPT-4 Turbo and later)
        model = payload['model']
        if use_json_format and ('gpt-4-turbo' in model.lower() or 'gpt-4o' in model.lower()):
            payload['response_format'] = {'type': 'json_object'}

        try:
            response = self._post_with_model_fallbacks(payload)
            result = response.json()

            # ==================== UPDATE ACTUAL USAGE ====================
            # Extract actual token usage from OpenAI response
            usage = result.get('usage', {})
            if usage:
                actual_total_tokens = usage.get('total_tokens', 0)
                actual_prompt_tokens = usage.get('prompt_tokens', 0)
                actual_completion_tokens = usage.get('completion_tokens', 0)

                # Calculate actual cost
                actual_cost = estimate_cost(actual_prompt_tokens, actual_completion_tokens)

                # Log actual vs estimated
                logger.info(
                    f"OpenAI usage: prompt={actual_prompt_tokens}, "
                    f"completion={actual_completion_tokens}, total={actual_total_tokens}, "
                    f"cost=${actual_cost:.4f} (estimated=${estimated_cost:.4f})"
                )

                # Update usage counter with actual tokens
                # Note: We already reserved estimated tokens, so we add actual tokens
                # This may slightly over-count but ensures we never under-count
                update_usage_after_call(user_id, actual_total_tokens)
            else:
                logger.warning("No usage data in OpenAI response - using estimates")
                update_usage_after_call(user_id, total_tokens_estimated)
            # ==================== END USAGE UPDATE ====================

            choice = result['choices'][0]
            content = choice['message']['content']
            finish_reason = choice.get('finish_reason')

            # Try to parse as JSON and validate structure
            if use_json_format:
                content = self._parse_json_response(content)

            return content, finish_reason == 'length'

        except requests.exceptions.HTTPError as e:
            # Handle 429 (rate limit) and insufficient_quota errors
            if e.response is not None:
                status_code = e.response.status_code
                try:
                    error_body = e.response.json()
                    error_preview = sanitize_log(str(error_body))
                except:
                    error_preview = sanitize_log(e.response.text)

                logger.error(
                    f"OpenAI API error: status={status_code}, "
                    f"body_preview={error_preview[:256]}"
                )

                # If it's a quota/rate limit error, raise specific exception
                if status_code == 429 or 'insufficient_quota' in error_preview.lower():
                    raise QuotaExceededError(
                        f"OpenAI API quota/rate limit error: {error_preview[:200]}"
                    )
            raise

    def _post_with_retry(self, payload: Dict[str, Any]) -> requests.Response:
        max_retries = self._get_int_env('OPENAI_MAX_RETRIES', 3)
        backoff_base = float(os.getenv('OPENAI_BACKOFF_BASE', '1'))
        timeout = self._get_int_env('OPENAI_TIMEOUT', 90)

        for attempt in range(max_retries + 1):
            try:
                response = requests.post(
                    f'{self.base_url}/chat/completions',
                    headers=self.headers,
                    json=payload,
                    timeout=timeout
                )
            except requests.exceptions.RequestException as error:
                if self._is_dns_error(error):
                    failed_base_url = self.base_url
                    next_base_url = self._next_base_url()
                    logger.warning(
                        "DNS failure contacting OpenAI base URL; switching to alternate.",
                        extra={
                            "error_code": "OPENAI_DNS_FAILURE",
                            "base_url": failed_base_url,
                            "next_base_url": next_base_url,
                            "attempt": attempt + 1,
                        },
                    )
                    capture_message(
                        "OpenAI DNS failure detected",
                        level="error",
                        context={
                            "base_url": failed_base_url,
                            "next_base_url": next_base_url,
                            "attempt": attempt + 1,
                        },
                    )
                    if attempt >= max_retries:
                        raise
                    delay = backoff_base * (2 ** attempt)
                    time.sleep(delay + random.uniform(0, 0.25))
                    continue
                raise
            if response.status_code == 429 or response.status_code >= 500:
                if attempt >= max_retries:
                    response.raise_for_status()
                retry_after = response.headers.get('Retry-After')
                delay = backoff_base * (2 ** attempt)
                if retry_after:
                    try:
                        delay = max(delay, float(retry_after))
                    except ValueError:
                        pass
                time.sleep(delay + random.uniform(0, 0.25))
                continue

            response.raise_for_status()
            return response

        raise requests.exceptions.RequestException("OpenAI API retries exhausted.")

    def _estimate_tokens(self, text: str) -> int:
        if not text:
            return 0
        return max(1, len(text) // 4)

    def _split_prompt_sections(self, prompt: str) -> Tuple[str, List[str]]:
        lines = prompt.splitlines()
        preamble_lines = []
        sections: List[str] = []
        current_lines: List[str] = []
        in_section = False

        for line in lines:
            if re.match(r'^\s*(\d+\.|##)\s+', line):
                if in_section:
                    sections.append("\n".join(current_lines).strip())
                    current_lines = []
                else:
                    preamble_lines = current_lines
                    current_lines = []
                    in_section = True
                current_lines.append(line)
            else:
                current_lines.append(line)

        if in_section:
            sections.append("\n".join(current_lines).strip())
        else:
            preamble_lines = current_lines

        preamble = "\n".join(preamble_lines).strip()
        sections = [section for section in sections if section]
        return preamble, sections
    def generate_karmic_journey(self, birth_data: Dict[str, Any], user_id: Optional[str] = None) -> Dict[str, Any]:
        """Generate comprehensive karmic journey analysis"""
        prompt = f"""
        Generate a comprehensive karmic journey analysis for:
        - Date of Birth: {birth_data.get('date_of_birth')}
        - Time of Birth: {birth_data.get('time_of_birth')}
        - Place of Birth: {birth_data.get('place_of_birth')}
        - Zodiac Sign: {birth_data.get('zodiac_sign')}
        - Nakshatra: {birth_data.get('nakshatra')}

        Provide detailed insights on:
        1. Soul's primary purpose in this lifetime
        2. Karmic lessons to be learned
        3. Soul evolution stage
        4. Dharmic path and life mission
        5. Karmic debts and credits
        6. Soul group connections
        """

        prediction_result = self.generate_prediction(prompt, birth_data, return_metadata=True, user_id=user_id)
        prediction = prediction_result['text']

        return {
            'journey_analysis': prediction,
            'soul_purpose': self._extract_section(prediction, 'purpose'),
            'karmic_lessons': self._extract_section(prediction, 'lessons'),
            'dharmic_path': self._extract_section(prediction, 'dharmic path'),
            'partial': prediction_result['partial'],
            'timestamp': self._get_timestamp()
        }

    def generate_past_lives_analysis(self, birth_data: Dict[str, Any], user_id: Optional[str] = None) -> Dict[str, Any]:
        """Generate past lives analysis with authentic corpus integration"""
        # Get relevant past life patterns from corpus
        corpus_context = ""
        if self.corpus_loader:
            past_life_engines = self.corpus_loader.get_past_life_engines(birth_data, limit=3)
            if past_life_engines:
                corpus_context = "\n\n" + self.corpus_loader.format_past_life_engines_for_context(past_life_engines)
        
        prompt = f"""
        Based on Vedic astrology and Nadi Jyotisha principles, analyze past life influences for:
        - Zodiac Sign: {birth_data.get('zodiac_sign')}
        - Nakshatra: {birth_data.get('nakshatra')}
        - Moon Sign: {birth_data.get('moon_sign')}
        - South Node (Ketu) position: {birth_data.get('ketu_position')}

        {corpus_context}

        Provide EXTENSIVE insights on:
        1. Most significant past life era and location (multiple lives)
        2. Past life professions and roles with detailed narratives
        3. Unresolved karmic patterns with specific descriptions
        4. Past life relationships affecting current life
        5. Skills and talents carried forward
        6. Past life traumas needing healing
        
        **Reference the authentic corpus patterns above and cite specific sutras/folios.**
        """

        analysis_result = self.generate_prediction(prompt, birth_data, return_metadata=True, user_id=user_id)
        analysis = analysis_result['text']

        return {
            'past_life_analysis': analysis,
            'significant_lives': self._extract_lives(analysis),
            'karmic_patterns': self._extract_patterns(analysis),
            'carried_talents': self._extract_section(analysis, 'skills and talents'),
            'partial': analysis_result['partial'],
            'timestamp': self._get_timestamp()
        }

    def generate_future_lives_prediction(self, birth_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate future lives prediction with authentic corpus integration"""
        # Get relevant future life patterns from corpus
        corpus_context = ""
        if self.corpus_loader:
            future_engines = self.corpus_loader.get_future_engines(birth_data, limit=3)
            if future_engines:
                corpus_context = "\n\n" + self.corpus_loader.format_future_engines_for_context(future_engines)
        
        prompt = f"""
        Based on current karmic trajectory and soul evolution, predict future life possibilities:
        - Current Zodiac: {birth_data.get('zodiac_sign')}
        - Spiritual Development Level: {birth_data.get('spiritual_level', 'Intermediate')}
        - North Node (Rahu) position: {birth_data.get('rahu_position')}

        {corpus_context}

        Provide EXTENSIVE insights on:
        1. Likely future birth scenarios with detailed descriptions
        2. Soul evolution trajectory and stages
        3. Future life purposes and missions
        4. Potential spiritual advancement paths
        5. Conditions for liberation (moksha)
        6. Timeline and probability assessments
        
        **Reference the authentic corpus trajectories above and cite specific sutras/folios.**
        """

        prediction_result = self.generate_prediction(prompt, birth_data, return_metadata=True)
        prediction = prediction_result['text']

        return {
            'future_prediction': prediction,
            'evolution_path': self._extract_section(prediction, 'evolution'),
            'future_scenarios': self._extract_scenarios(prediction),
            'moksha_timeline': self._extract_section(prediction, 'liberation'),
            'partial': prediction_result['partial'],
            'timestamp': self._get_timestamp()
        }

    def generate_present_life_analysis(self, birth_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate present life comprehensive analysis"""
        prompt = f"""
        Provide a comprehensive present life analysis:
        - Date of Birth: {birth_data.get('date_of_birth')}
        - Current Age: {birth_data.get('age', 'Unknown')}
        - Zodiac Sign: {birth_data.get('zodiac_sign')}
        - Nakshatra: {birth_data.get('nakshatra')}
        - Current Dasha Period: {birth_data.get('dasha_period', 'Unknown')}

        Analyze:
        1. Current life phase and challenges
        2. Career and professional path
        3. Relationships and partnerships
        4. Health and wellbeing
        5. Financial prospects
        6. Spiritual growth opportunities
        7. Current karmic lessons in progress
        """

        analysis_result = self.generate_prediction(prompt, birth_data, return_metadata=True)
        analysis = analysis_result['text']

        return {
            'life_analysis': analysis,
            'current_phase': self._extract_section(analysis, 'life phase'),
            'career_path': self._extract_section(analysis, 'career'),
            'relationships': self._extract_section(analysis, 'relationships'),
            'health_guidance': self._extract_section(analysis, 'health'),
            'spiritual_growth': self._extract_section(analysis, 'spiritual'),
            'partial': analysis_result['partial'],
            'timestamp': self._get_timestamp()
        }

    def generate_life_events_prediction(self, birth_data: Dict[str, Any], years_ahead: int = 10) -> Dict[str, Any]:
        """Generate important life events prediction"""
        prompt = f"""
        Predict important life events for the next {years_ahead} years:
        - Date of Birth: {birth_data.get('date_of_birth')}
        - Zodiac Sign: {birth_data.get('zodiac_sign')}
        - Current Dasha: {birth_data.get('dasha_period')}

        Provide year-by-year predictions for:
        1. Major life transitions
        2. Career milestones
        3. Relationship events (marriage, partnerships)
        4. Financial opportunities and challenges
        5. Spiritual breakthroughs
        6. Health alerts and wellness periods
        7. Auspicious times for major decisions
        """

        prediction_result = self.generate_prediction(prompt, birth_data, return_metadata=True)
        prediction = prediction_result['text']

        return {
            'events_prediction': prediction,
            'yearly_forecast': self._extract_yearly_forecast(prediction, years_ahead),
            'major_transitions': self._extract_transitions(prediction),
            'auspicious_periods': self._extract_auspicious_times(prediction),
            'partial': prediction_result['partial'],
            'timestamp': self._get_timestamp()
        }

    def generate_karmic_remedies(self, birth_data: Dict[str, Any], challenges: List[str] = None) -> Dict[str, Any]:
        """Generate personalized karmic remedies with authentic corpus integration"""
        challenges_text = ', '.join(challenges) if challenges else 'general wellbeing'
        
        # Get relevant remedies from corpus
        corpus_context = ""
        if self.corpus_loader:
            remedies = self.corpus_loader.get_remedies(birth_data, limit=5)
            if remedies:
                corpus_context = "\n\n" + self.corpus_loader.format_remedies_for_context(remedies)

        prompt = f"""
        Provide personalized Vedic remedies and spiritual practices for:
        - Zodiac Sign: {birth_data.get('zodiac_sign')}
        - Nakshatra: {birth_data.get('nakshatra')}
        - Planetary Afflictions: {birth_data.get('afflictions', 'None specified')}
        - Current Challenges: {challenges_text}

        {corpus_context}

        Recommend EXTENSIVE practices including:
        1. Mantras (with pronunciation, meaning, and repetition counts)
        2. Gemstone therapy (specific stones, carats, wearing instructions)
        3. Charitable activities (dana) - specific items and timing
        4. Fasting days and rituals
        5. Deity worship and prayers
        6. Lifestyle modifications
        7. Meditation practices
        8. Yantra and sacred geometry
        
        **Reference the authentic remedial practices above and cite specific sutras/folios.**
        """

        remedies_result = self.generate_prediction(prompt, birth_data, return_metadata=True)
        remedies = remedies_result['text']

        return {
            'remedies_analysis': remedies,
            'mantras': self._extract_mantras(remedies),
            'gemstones': self._extract_gemstones(remedies),
            'rituals': self._extract_rituals(remedies),
            'lifestyle_changes': self._extract_section(remedies, 'lifestyle'),
            'meditation_practices': self._extract_section(remedies, 'meditation'),
            'partial': remedies_result['partial'],
            'timestamp': self._get_timestamp()
        }

    def _fallback_prediction(self, prompt: str, context: Dict[str, Any] = None) -> str:
        """
        Category-specific fallback prediction when API is unavailable
        Uses offline wisdom generator for detailed, structured predictions
        """
        # Detect category from prompt
        category = self._detect_category_from_prompt(prompt)

        # If offline wisdom generator is available, use category-specific generation
        if self.offline_wisdom and context:
            try:
                if category == 'karmic_journey':
                    return self._ensure_fallback_headers(
                        self.offline_wisdom.generate_karmic_journey(context)
                    )
                elif category == 'past_lives':
                    return self._ensure_fallback_headers(
                        self.offline_wisdom.generate_past_lives(context)
                    )
                elif category == 'future_lives':
                    return self._ensure_fallback_headers(
                        self.offline_wisdom.generate_future_lives(context)
                    )
                elif category == 'present_life':
                    return self._ensure_fallback_headers(
                        self.offline_wisdom.generate_present_life(context)
                    )
                elif category == 'life_events':
                    return self._ensure_fallback_headers(
                        self.offline_wisdom.generate_life_events(context)
                    )
                elif category == 'karmic_remedies':
                    return self._ensure_fallback_headers(
                        self.offline_wisdom.generate_karmic_remedies(context)
                    )
                elif category == 'relationships':
                    return self._ensure_fallback_headers(
                        self.offline_wisdom.generate_relationships(context)
                    )
                elif category == 'predictions':
                    return self._ensure_fallback_headers(
                        self.offline_wisdom.generate_general_predictions(context)
                    )
            except Exception as e:
                self._set_last_error(
                    "OPENAI_OFFLINE_WISDOM_FAILED",
                    "Offline wisdom generation failed.",
                    {"error": str(e)},
                )
                logger.warning(
                    "Offline wisdom generation failed",
                    extra={"error_code": "OPENAI_OFFLINE_WISDOM_FAILED", "error": str(e)},
                )

        # Generic fallback if offline wisdom not available or failed
        return self._ensure_fallback_headers(self._generic_fallback(context))

    def _set_last_error(self, code: str, message: str, details: Optional[Dict[str, Any]] = None) -> None:
        error_payload: Dict[str, Any] = {"code": code, "message": message}
        if details:
            error_payload["details"] = details
        self.last_error = error_payload

    def _clear_last_error(self) -> None:
        self.last_error = None

    def _ensure_fallback_headers(self, text: str) -> str:
        if not text:
            return text
        if any(line.strip().startswith("##") for line in text.splitlines()):
            return text
        return f"## Summary\n\n{text}"

    def _detect_category_from_prompt(self, prompt: str) -> str:
        """Detect prediction category from the prompt content"""
        prompt_lower = prompt.lower()

        if 'karmic journey' in prompt_lower or 'soul\'s purpose' in prompt_lower or 'soul purpose' in prompt_lower:
            return 'karmic_journey'
        elif 'past life' in prompt_lower or 'past lives' in prompt_lower or 'previous incarnation' in prompt_lower:
            return 'past_lives'
        elif 'future life' in prompt_lower or 'future lives' in prompt_lower or 'future incarnation' in prompt_lower or 'moksha' in prompt_lower:
            return 'future_lives'
        elif 'present life' in prompt_lower or 'current life' in prompt_lower:
            return 'present_life'
        elif 'life event' in prompt_lower or 'year-by-year' in prompt_lower or 'timing' in prompt_lower:
            return 'life_events'
        elif 'remed' in prompt_lower or 'mantra' in prompt_lower or 'gemstone' in prompt_lower:
            return 'karmic_remedies'
        elif 'relationship' in prompt_lower or 'marriage' in prompt_lower or 'partner' in prompt_lower:
            return 'relationships'
        elif 'daily' in prompt_lower or 'weekly' in prompt_lower or 'monthly' in prompt_lower or 'yearly' in prompt_lower:
            return 'predictions'

        return 'general'

    def _generic_fallback(self, context: Dict[str, Any] = None) -> str:
        """Generic fallback when category-specific generation is not possible"""
        zodiac = context.get('zodiac_sign', 'Unknown') if context else 'Unknown'
        nakshatra = context.get('nakshatra', 'Unknown') if context else 'Unknown'
        moon_sign = context.get('moon_sign', zodiac) if context else zodiac

        return f"""## Vedic Astrological Analysis

Based on the sacred principles of Bhrigu Samhita and Nadi Jyotisha, here is your personalized reading:

### Your Cosmic Configuration
- **Sun Sign (Rashi):** {zodiac}
- **Birth Star (Nakshatra):** {nakshatra}
- **Moon Sign:** {moon_sign}

### General Guidance from Bhrigu Samhita

According to the ancient wisdom of Maharishi Bhrigu, every soul incarnates with a specific purpose and karmic blueprint. Your planetary configuration at birth reveals:

**Soul Purpose:** Your placement suggests a journey focused on spiritual evolution and dharmic fulfillment. The stars indicate you are here to learn important lessons about balance, relationships, and self-mastery.

**Karmic Patterns:** Based on traditional Vedic principles, your chart indicates past-life connections that influence your current circumstances. Saturn's influence teaches patience and perseverance, while Jupiter blesses you with wisdom and spiritual insight.

**Life Path:** The Nadi texts suggest periods of both challenge and opportunity ahead. Trust in the divine timing of events, as each experience serves your soul's evolution.

### Recommended Practices

1. **Daily Mantra:** Chant the Gayatri Mantra 108 times at sunrise for spiritual protection
2. **Meditation:** Practice 20 minutes of silent meditation focusing on your third eye
3. **Charitable Acts:** Donate food to the needy on Saturdays to appease Saturn
4. **Gemstone:** Consider wearing your birth nakshatra's recommended gemstone after consultation

### Important Note

For detailed, personalized predictions with precise timing based on your complete birth chart, Dasha periods, and current transits, please ensure the AI service is properly configured. The full analysis includes:
- Specific yoga combinations in your chart
- Precise timing of major life events
- Detailed past-life insights
- Personalized remedies and mantras

*May the divine light of the Navagrahas guide your path.*

---
*This reading is based on classical Vedic principles. For complete AI-enhanced predictions, please contact the administrator.*"""

    def _extract_section(self, text: str, section_keyword: str) -> str:
        """Extract specific section from prediction text with intelligent parsing"""
        if not text:
            return "Analysis available in full report"

        lines = text.split('\n')
        section_lines = []
        in_section = False
        section_level = 0

        for i, line in enumerate(lines):
            stripped = line.strip()

            # Detect section header with keyword
            if section_keyword.lower() in stripped.lower():
                if stripped.startswith('#'):
                    in_section = True
                    section_level = len(stripped) - len(stripped.lstrip('#'))
                    section_lines.append(line)
                    continue
                elif ':' in stripped or stripped.endswith(':'):
                    in_section = True
                    section_level = 0
                    section_lines.append(line)
                    continue

            # If in section, add content until next section of same or higher level
            if in_section:
                if stripped.startswith('#'):
                    current_level = len(stripped) - len(stripped.lstrip('#'))
                    if current_level <= section_level and section_level > 0:
                        break
                    elif section_level == 0:
                        break
                section_lines.append(line)

        result = '\n'.join(section_lines).strip()
        return result if result else f"See full analysis for {section_keyword}"

    def _extract_lives(self, text: str) -> List[Dict[str, str]]:
        """Extract past life information with intelligent parsing"""
        lives = []
        lines = text.split('\n')
        current_life = {}

        for line in lines:
            lower_line = line.lower()
            # Look for era indicators
            if any(term in lower_line for term in ['century', 'era', 'period', 'bc', 'ad', 'ancient']):
                if current_life:
                    lives.append(current_life)
                current_life = {'era': line.strip(), 'role': '', 'location': ''}
            # Look for role/profession
            elif any(term in lower_line for term in ['profession', 'role', 'occupation', 'worked as', 'served as']):
                if current_life:
                    current_life['role'] = line.strip()
            # Look for location
            elif any(term in lower_line for term in ['location', 'place', 'region', 'country', 'city']):
                if current_life:
                    current_life['location'] = line.strip()

        if current_life:
            lives.append(current_life)

        return lives if lives else [{'era': 'See full analysis', 'role': 'Detailed in report', 'location': 'Detailed in report'}]

    def _extract_patterns(self, text: str) -> List[str]:
        """Extract karmic patterns with intelligent parsing"""
        patterns = []
        lines = text.split('\n')

        for line in lines:
            lower_line = line.lower()
            # Look for pattern indicators
            if any(term in lower_line for term in ['pattern', 'recurring', 'repeating', 'cycle', 'theme']):
                stripped = line.strip().lstrip('-*•123456789. ')
                if len(stripped) > 10:  # Meaningful content
                    patterns.append(stripped)

        return patterns[:10] if patterns else ['Karmic patterns detailed in comprehensive analysis']

    def _extract_scenarios(self, text: str) -> List[str]:
        """Extract future scenarios with intelligent parsing"""
        scenarios = []
        lines = text.split('\n')

        for line in lines:
            lower_line = line.lower()
            # Look for scenario indicators
            if any(term in lower_line for term in ['scenario', 'possibility', 'likely', 'potential', 'future']):
                stripped = line.strip().lstrip('-*•123456789. ')
                if len(stripped) > 15:
                    scenarios.append(stripped)

        return scenarios[:8] if scenarios else ['Future scenarios detailed in comprehensive analysis']

    def _extract_yearly_forecast(self, text: str, years: int) -> List[Dict[str, Any]]:
        """Extract yearly forecast with intelligent parsing"""
        forecasts = []
        lines = text.split('\n')
        current_year = None
        current_forecast = []

        for line in lines:
            # Look for year indicators
            if any(term in line.lower() for term in ['year', 'age']):
                if any(char.isdigit() for char in line):
                    if current_year and current_forecast:
                        forecasts.append({
                            'year': current_year,
                            'forecast': '\n'.join(current_forecast)
                        })
                    current_year = line.strip()
                    current_forecast = []
            elif current_year and line.strip():
                current_forecast.append(line.strip())

        if current_year and current_forecast:
            forecasts.append({
                'year': current_year,
                'forecast': '\n'.join(current_forecast)
            })

        return forecasts if forecasts else [{'year': f'Year {i+1}', 'forecast': 'Detailed in full report'} for i in range(years)]

    def _extract_transitions(self, text: str) -> List[str]:
        """Extract major life transitions with intelligent parsing"""
        transitions = []
        lines = text.split('\n')

        for line in lines:
            lower_line = line.lower()
            # Look for transition indicators
            if any(term in lower_line for term in ['transition', 'change', 'milestone', 'shift', 'transformation']):
                stripped = line.strip().lstrip('-*•123456789. ')
                if len(stripped) > 10:
                    transitions.append(stripped)

        return transitions[:10] if transitions else ['Major transitions detailed in comprehensive analysis']

    def _extract_auspicious_times(self, text: str) -> List[str]:
        """Extract auspicious periods with intelligent parsing"""
        times = []
        lines = text.split('\n')

        for line in lines:
            lower_line = line.lower()
            # Look for auspicious time indicators
            if any(term in lower_line for term in ['auspicious', 'favorable', 'beneficial', 'lucky', 'good time', 'best time']):
                stripped = line.strip().lstrip('-*•123456789. ')
                if len(stripped) > 10:
                    times.append(stripped)

        return times[:12] if times else ['Auspicious times calculated based on planetary positions']

    def _extract_mantras(self, text: str) -> List[Dict[str, str]]:
        """Extract mantra recommendations with intelligent parsing"""
        mantras = []
        lines = text.split('\n')
        current_mantra = {}

        for line in lines:
            lower_line = line.lower()
            # Look for mantra indicators
            if 'mantra' in lower_line or 'om' in lower_line or 'namah' in lower_line:
                if current_mantra and 'mantra' in current_mantra:
                    mantras.append(current_mantra)
                    current_mantra = {}
                current_mantra['mantra'] = line.strip()
            elif current_mantra and any(term in lower_line for term in ['purpose', 'benefit', 'for']):
                current_mantra['purpose'] = line.strip()
            elif current_mantra and any(term in lower_line for term in ['times', 'repetitions', 'count']):
                current_mantra['repetitions'] = line.strip()

        if current_mantra:
            mantras.append(current_mantra)

        return mantras if mantras else [{'mantra': 'See full analysis for specific mantras', 'purpose': 'Based on chart analysis'}]

    def _extract_gemstones(self, text: str) -> List[str]:
        """Extract gemstone recommendations with intelligent parsing"""
        gemstones = []
        lines = text.split('\n')

        for line in lines:
            lower_line = line.lower()
            # Look for gemstone names
            if any(gem in lower_line for gem in ['ruby', 'pearl', 'coral', 'emerald', 'yellow sapphire', 'diamond', 'blue sapphire', 'hessonite', 'cat\'s eye', 'sapphire']):
                stripped = line.strip().lstrip('-*•123456789. ')
                if stripped:
                    gemstones.append(stripped)

        return gemstones[:5] if gemstones else ['Gemstone recommendations available in full report']

    def _extract_rituals(self, text: str) -> List[str]:
        """Extract ritual recommendations with intelligent parsing"""
        rituals = []
        lines = text.split('\n')

        for line in lines:
            lower_line = line.lower()
            # Look for ritual indicators
            if any(term in lower_line for term in ['ritual', 'puja', 'ceremony', 'worship', 'offering', 'fast', 'fasting']):
                stripped = line.strip().lstrip('-*•123456789. ')
                if len(stripped) > 10:
                    rituals.append(stripped)

        return rituals[:10] if rituals else ['Ritual recommendations detailed in comprehensive analysis']

    def _get_timestamp(self) -> str:
        """Get current timestamp"""
        from datetime import datetime
        return datetime.utcnow().isoformat()

# Lazy singleton instance
_openai_service_instance = None

def get_openai_service():
    """Get or create the OpenAI service singleton instance"""
    global _openai_service_instance
    if _openai_service_instance is None:
        _openai_service_instance = OpenAIService()
    return _openai_service_instance


def get_openai_initialization_errors() -> List[str]:
    """Get initialization errors recorded during OpenAI service setup."""
    errors: List[str] = []
    if _openai_service_instance:
        if _openai_service_instance.corpus_error:
            errors.append(f"Corpus loader error: {_openai_service_instance.corpus_error.get('message')}")
        if _openai_service_instance.offline_wisdom_error:
            errors.append(f"Offline wisdom error: {_openai_service_instance.offline_wisdom_error.get('message')}")
        if getattr(_openai_service_instance, "initialization_errors", None):
            errors.extend(_openai_service_instance.initialization_errors)
    return errors

# Backwards compatibility - creates instance on first access
class _LazyProxy:
    def __getattr__(self, name):
        return getattr(get_openai_service(), name)

openai_service = _LazyProxy()
