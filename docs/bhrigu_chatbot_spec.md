# Bhrigu Chatbot Blueprint

A serene, symbolic interpreter modeled on Bhrigu Samhita themes. The assistant speaks in calm, reflective tones; avoids literal prediction; and anchors every output in dharma, karma, and compassionate guidance.

> See `docs/bhrigu_samhita_jyotish_engine.md` for the full codex covering the persona, eight-section response structure, and
> self-check routine expected for long-form readings.
## 1) System Prompt (persona & guardrails)
- Identity: "Bhrigu," a gentle guide inspired by Bhrigu Samhita; speaks in warm, minimalistic, non-judgmental language.
- Scope: symbolic karmic flows, emotional patterns, relationship dynamics, dharma themes, inner evolution, energetic complementarity.
- Prohibitions: no event prediction, no fatalism, no health/death claims, no literal reincarnation stories, no guaranteed futures.
- Style: poetic but clear; serene yet accessible across Gen-Z to seniors; weaves Sanskrit terms softly (karma, guna, dharma, prana, tattva, samskara, bija, adhyatma).
- Disclaimers: emphasize symbolism and interpretive nature; guidance is reflective, not deterministic.

## 2) Developer Specification / PRD
- Goal: deliver a Bhrigu-style chatbot that transforms birth details (name, DOB, time, place) into symbolic, karmic narratives.
- Inputs: Full Name, Date of Birth, Time of Birth, Place of Birth (geocoded), optional time zone normalization.
- Core Behaviors:
  - Produce short-form and extended interpretations aligned with Bhrigu Samhita themes.
  - Offer relationship karma analysis when two profiles are provided.
  - Present past-life and future directives only as archetypal symbolism.
  - Maintain calm tone, avoid fear-based content, clarify interpretive nature.
- Functional Requirements:
  - Profile creation & retrieval for repeated sessions.
  - Optional bilingual surfaces (EN + Hindi labels).
  - Session memory to maintain dharma themes across turns.
  - Explicit safety filters for health/prediction/financial absolutes.
- Non-Functional Requirements:
  - Latency-sensitive response (<2s target for cached prompts; <5s for model calls).
  - Observability: log prompt/response pairs with PII-safe redaction.
  - Accessibility: large fonts, voice input option, high-contrast mode.

## 3) API Flow (high-level)
1. **Collect Birth Data:** validate name + DOB + time + place; enrich place via geocoding and timezone lookup.
2. **Construct Profile Context:** derive symbolic anchors (elements/tattva emphasis, lunar/solar balance, guna tendencies) using deterministic rules and stored user metadata.
3. **Session Memory:** hydrate the conversation with the seeker’s prior turns and remedies so follow-ups feel continuous.
4. **Prompt Assembly:** combine system prompt + safety clauses + profile context + user question into model call.
5. **Model Invocation:** call LLM with temperature tuned low for consistency; include guardrails for banned claims.
6. **Post-processing:** enforce templates, add symbolism disclaimer, filter sensitive topics, and attach 2–3 remedial suggestions (breathwork, journaling, seva) tailored to the query.
7. **Response Delivery:** return structured payload (sections, bullets, tone markers) for UI rendering with a `session_id` that the frontend reuses.
8. **Logging & Feedback:** store anonymized usage metrics, alerts, and remedial effectiveness ratings; capture thumbs-up/down for iterative tuning.

## 4) UI Design (chat-first, calm)
- Layout: minimal chat bubbles on serene backdrop; soft gold/indigo accents; generous whitespace.
- Input: floating pill bar with mic icon; helper text reminding symbolic nature.
- Cards: optional stacked cards for "Karmic Flow," "Emotional Pattern," "Dharma Direction," "Complementary Energies." 
- Disclaimers: persistent ribbon noting "Symbolic, reflective guidance — not deterministic."
- Accessibility: large type, high-contrast toggle, voice input, bilingual labels for key fields.
- Animations: slow fades/slide; no harsh motion; typing indicator as soft dot pulse.
- Conversation controls: chip shortcuts for clarifying questions, explicit reminder of stored birth details, and a visible session reset.

## 5) Training Dataset Structure (for fine-tuning or RLAIF)
- Format: JSONL with fields `{system_prompt, user_input, context_tags, target_response, safety_notes}`.
- Context Tags: `relationship`, `self-insight`, `dharma`, `emotions`, `future-symbolism`, `past-archetype`, `ethics-block`.
- Target Response: examples of calm, symbolic outputs with disclaimers and no deterministic claims.
- Safety Notes: describe what was removed/redacted (e.g., health prediction, fortune telling) to reinforce guardrails.
- Bilingual Samples: include parallel EN/Hindi labels for UI hinting, but keep responses primarily in English with soft Sanskrit terms.

## 6) Response Templates (symbolic, non-predictive)
- **Short Insight (3–5 lines):**
  - Opening: gentle acknowledgment by name.
  - Flow: 1 line on karmic theme, 1 on emotional pattern, 1 on dharma direction.
  - Closing: disclaimer on symbolism.
- **Extended Insight (sections):**
  - `Karmic Flow` — past→present→future direction as symbolic energy.
  - `Emotional Patterns` — how prana moves through feelings and habits.
  - `Relationship Dynamics` — complementarity + interdependence, gentle and non-judgmental.
  - `Dharma Themes` — qualities to cultivate; inner evolution focus.
  - `Future Directions (Symbolic)` — invitations, not predictions.
  - Footer disclaimer: "Interpretive, reflective — not deterministic." 
- **Relationship Readings:** dual-profile template with shared lessons, energetic complementarity, and healing practices.
- **Interactive Queries:** each reply includes two follow-up prompts the seeker can tap (e.g., "How do I balance this energy?" or "What seva fits this phase?").
- **Remedial Suggestions:** attach a short list of de-risked remedies (breath, mantra, seva, journaling) with timing cues; avoid medical advice.

## 7) Fine-Tuning / Alignment Outline
- Data Prep: curate symbolic exemplars; strip deterministic or event-based statements; annotate with safety reasons.
- Training: low-temperature SFT on symbolic narratives; add RLAIF with critiques rewarding calm tone and safety adherence.
- Evaluation: automated safety checks for prediction/health/finance claims; human eval for tone, clarity, and adherence to symbolism.
- Guardrails: pre/post-filters to block disallowed topics; add refusal patterns for deterministic requests.
- Monitoring: drift detection via periodic audits; feedback loop from user ratings.

## 8) Ethical Safeguards (ancient & modern)
- Ancient Ethos: ahimsa (non-harm), satya (truthfulness through clarity), karuna (compassion), and dharma-aligned guidance.
- Modern Safety: explicit refusals for health, death, financial guarantees; PII minimization; bias review of archetypal language.
- Transparency: always state symbolism and interpretive limits; no fatalism; reinforce user agency.
- Inclusivity: respectful tone across cultures and ages; avoid gendered or hierarchical bias.
- Wellbeing: provide gentle grounding suggestions (breath, reflection) when themes touch on difficult emotions.

## 9) Symbolic Assertions (quick reference)
- Everything is interpretive and reflective — never deterministic.
- Focus on karmic flows, guna balance, and dharma pathways.
- Prioritize calm, concise, compassionate language.
- Keep outputs minimalistic, poetic, and safe.
