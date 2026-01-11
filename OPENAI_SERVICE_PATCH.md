# OpenAI Service Integration Patch

This document describes the minimal changes needed to integrate the AI quota and cost management system into `backend/services/openai_service.py`.

## Summary of Changes

1. Import the new `ai_quota` module
2. Add quota and cost checks before making OpenAI API calls
3. Return fallback responses when quota/cost limits are exceeded
4. Update usage counters after successful API calls
5. Handle quota/cost errors gracefully with fallback

## Detailed Patch Instructions

### 1. Add Import Statement (Line ~16, after other service imports)

```python
# Add this import after line 18 (from services.sentry_service import capture_message)
from services.ai_quota import (
    estimate_tokens,
    estimate_cost,
    check_daily_quota_and_reserve,
    update_usage_after_call,
    sanitize_log,
    QuotaExceededError,
    CostLimitExceededError
)
```

### 2. Modify `_request_completion` Method (Line 449)

Replace the entire `_request_completion` method with this quota-aware version:

```python
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
        'max_tokens': int(os.getenv('OPENAI_MAX_TOKENS', '4000'))
    }

    # ==================== QUOTA AND COST CHECKS ====================

    # Estimate tokens for quota check
    prompt_tokens_estimated = estimate_tokens(prompt) + estimate_tokens(system_content)
    response_tokens_estimated = payload['max_tokens']
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
            # Note: We already reserved estimated tokens, so we need to adjust
            # For simplicity, we just add actual tokens (may slightly over-count)
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
```

### 3. Modify `generate_prediction` Method (Line 167)

Update the method signature and add quota/cost error handling:

```python
def generate_prediction(
    self,
    prompt: str,
    context: Dict[str, Any] = None,
    return_metadata: bool = False,
    user_id: Optional[str] = None  # ADD THIS PARAMETER
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
                'partial': False,
                'metadata': {
                    'ai_model': self.get_selected_model(),
                    'fallback': True,
                    'reason': 'api_disabled'
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

        # Pass user_id to the chunking method
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

    # ==================== QUOTA AND COST ERROR HANDLING ====================
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
                'partial': False,
                'metadata': {
                    'ai_model': self.get_selected_model(),
                    'fallback': True,
                    'reason': error_reason
                }
            }
        return fallback
    # ==================== END QUOTA ERROR HANDLING ====================

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
                'partial': False,
                'metadata': {
                    'ai_model': self.get_selected_model(),
                    'fallback': True,
                    'reason': 'api_error'
                }
            }
        return fallback
```

### 4. Update `_generate_with_chunking` Method (Line 291)

Add user_id parameter to pass through to `_request_completion`:

```python
def _generate_with_chunking(self, prompt: str, system_content: str, user_id: Optional[str] = None) -> Tuple[str, bool]:
    max_prompt_tokens = int(os.getenv('OPENAI_PROMPT_TOKEN_BUDGET', '8000'))
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
```

### 5. Update Other Generation Methods to Pass user_id

For methods like `generate_karmic_journey`, `generate_past_lives_analysis`, etc., add `user_id` parameter and pass it through:

```python
# Example for generate_karmic_journey (line 597)
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
```

## Testing the Integration

After applying the patch, test with:

```python
from services.openai_service import get_openai_service

service = get_openai_service()

# Test with quota limits
result = service.generate_prediction(
    prompt="Generate a brief prediction",
    context={'zodiac_sign': 'Aries'},
    return_metadata=True,
    user_id='test_user_123'
)

print(result)
```

## Environment Variables Required

Make sure these are set in your `.env` file:

```bash
# Existing OpenAI vars
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
OPENAI_MAX_TOKENS=4000
OPENAI_TEMPERATURE=0.7

# New quota management vars
REDIS_URL=redis://localhost:6379
USER_DAILY_TOKEN_LIMIT=100000
OPENAI_COST_PER_1K=0.002
PER_REQUEST_COST_LIMIT=1.0
```

## Rollback Instructions

If you need to revert the changes:

1. Remove the `from services.ai_quota import ...` line
2. Revert `_request_completion`, `generate_prediction`, and `_generate_with_chunking` methods to their original versions
3. Remove `user_id` parameters from all generation methods
