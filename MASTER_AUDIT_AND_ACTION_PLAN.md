# BhriguWelt — Master Audit & Action Plan

**Date:** 2026-07-12
**Scope:** Full-codebase audit against four goals:
1. All textbook Bhrigu Samhita / Nadi Jyotisha principles correctly implemented
2. Efficient token usage (currently one result exhausts the quota)
3. More specificity and precision in predictions
4. No reloads, no looping, smooth operation

Every finding below carries file:line evidence. The two most severe claims (ayanamsa bug, quota double-count) were independently re-verified in source.

---

## Executive verdict

| Pillar | Verdict |
|---|---|
| Classical astrology correctness | **Broken at the foundation.** The live chart engine has a ~10° ayanamsa error, a fake ascendant formula, and a dasha that ignores birth balance. The *correct* Swiss-Ephemeris engine already exists in `app/` but is orphaned — never deployed. Most "principle" data is fabricated or never consulted. |
| Token efficiency | **One report ≈ 84k of a 100k daily quota.** Cause: 8–13 LLM calls per report × quota counted twice per call (reserve + actual). Fixable to ~6–8k per report (≈90% reduction). |
| Precision | **Structurally impossible today.** Computed chart facts (degrees, houses, pada, dasha) are dropped before the prompt; the model is told to cite placements it was never given; the only real dasha-timing service is dead code. |
| Smoothness | **Two genuine loops found.** Every keystroke in the question box triggers a new prediction request; every page mount fires the same generation twice; web workers are dead code so parsing blocks the UI; failures retry up to 9×. |

**The single most important strategic fact:** the codebase already contains most of the correct machinery (sidereal Swiss Ephemeris engine, real Vimshottari dasha with antardasha, D9 navamsa, yogas calculator, rule DSL, Redis cache, prompt optimizer) — but almost none of it is wired into the live request path. The plan below is mostly *wiring and fixing*, not greenfield building.

---

## PILLAR 1 — Classical Bhrigu Samhita / Nadi Jyotisha correctness

### 1A. Critical correctness bugs (live path)

1. **Ayanamsa formula is catastrophically wrong** — `backend/services/astrology_calculator.py:682-697`
   `ayanamsa = 23.85 + t * 50.27` where `t` is Julian *centuries*. 50.27 is the precession rate in **arc-seconds per year**; used as degrees/century it yields ~13.8° for a 1980 birth vs true Lahiri ≈23.57° — a **~9.8° error ≈ one-third of a sign / 0.73 nakshatra**. Every planet longitude, Moon sign, nakshatra+pada, and lagna from the live engine is wrong for any birth not near year 2000. This propagates into matchmaking kootas and every prediction.

2. **Ascendant is a fake approximation** — `astrology_calculator.py:613-616`
   `ascendant_tropical = (ramc + 90 + degrees(lat) * 0.5) % 360` — admitted "simplified formula." Not a valid lagna computation (needs obliquity + spherical trig), and the ayanamsa error compounds it.

3. **Live dasha ignores birth balance** — `astrology_calculator.py:655-680`
   Starts full mahadasha periods from birth without subtracting the elapsed fraction of the birth nakshatra. Current mahadasha can be off by up to a full period. No antardasha/pratyantardasha. (The correct implementation exists in `app/services/dasha.py:44-53` — orphaned.)

4. **`/birthchart` endpoint is Western tropical, not Vedic** — `backend/api_birthchart.py:198,228`
   Uses real pyswisseph but with no `FLG_SIDEREAL`/ayanamsa; Placidus houses; returns Uranus/Neptune/Pluto and Western aspects (sextile/square/trine). A Vedic app serving tropical rashi.

5. **Three conflicting chart engines coexist** — the weakest one is live:
   - A (live, buggy): `backend/services/astrology_calculator.py` — wired into all routes
   - B (tropical bug): `backend/api_birthchart.py` — registered at `backend/app.py:502`
   - C (correct, sidereal Swiss Ephemeris, D9, vargottama, real dasha): `app/services/ephemeris.py`, `chart.py`, `dasha.py` — **never deployed** (no Procfile/Dockerfile/render.yaml reference)

### 1B. "Principles" that are fabricated, dead, or chart-independent

6. **`backend/data/bhrigu_samhita_principles.yml` is AI-fabricated pseudo-content**, not classical text: "cloud telemetry" (BR-7), "blockchain customs registries" / "zero-knowledge archives" (PL-75/77), "DAO charters" (PL-78), "smart-city logistics" (FU-11), with invented folio citations and sha256 checksums. Must be replaced with genuinely sourced classical principles.

7. **The Nadi principle engine applies the same ~500 rules to every chart** — `backend/services/bhrigu_nadi_core_engine.py:309-324`
   Any principle without conditions returns `True`; the ~500 unconditioned rules "activate" for every birth chart, while conditioned rules never fire because the live chart schema lacks the keys they gate on (`jupiter_house`, `moon_element`, `saturn_retrograde`…). "N principles applied" is a constant, not a reading.

8. **The rule DSL is functionally dead** — `backend/services/rule_engine.py:200-206`
   Triggers require `chart_data['planets'][X]['house']`, but the live engine emits planets with only `{longitude, latitude, sign}` (`astrology_calculator.py:483-571`). All 56 well-formed rules in `core_wisdom/rule_index.json` never match. Additionally, per-category rule files (`core_wisdom/bhrigu_samhita/rules/*.json`) use a different schema (`trigger` str + `interpretation` dict) than the engine reads (`triggers` list + `narrative_template`) — loaded but never evaluated (`bhrigu_core_wisdom.py:80-89` vs `:178-186`).

9. **Yogas calculator is orphaned AND hardcodes yogas as active** — `backend/services/vedic_yogas_calculator.py`
   Never invoked by any route. Many yogas appended with `'active': True` regardless of chart (Raja `:161`, Dharma-Karma `:171`, Trikona `:181`, Dhana `:271`, Laxmi `:347`, Sunapha/Anapha/Adhi `:452-489`, Vesi/Vasi `:538-555`, Amala `:719`).

10. **Contradictory rule-applicability logic** — `principle_loader.py:47-48` returns `False` for empty conditions; `bhrigu_nadi_core_engine.py:324` returns `True` for the same case. Also silently skips loading `remedies` and `matchmaking_criteria` YAML sections (`principle_loader.py:207`).

### 1C. What is genuinely sound today

- **Ashtakoot matchmaking** (`backend/services/matchmaking_service.py`) — full 8-koota Guna Milan (Varna 1, Vashya 2, Tara 3, Yoni 4, Graha Maitri 5, Gana 6, Bhakoot 7, Nadi 8 = 36), Mangal dosha, Nadi dosha (`:133-176`). Wired and correct.
- **The orphaned `app/` engine** — correct sidereal Swiss Ephemeris, nakshatra+pada, D9 navamsa incl. vargottama (`app/services/ephemeris.py:176-308`), correct Vimshottari with birth balance + antardasha (`app/services/dasha.py`).
- **Vimshottari year lengths** are correct everywhere (Ketu 7 … Mercury 17 = 120).
- `vedic_calculation_engine.py:295-386` — correct dasha balance + bhuktis; `:483-722` remedies (gemstone/mantra/charity/yantra) — but only reachable via `comprehensive_prediction_service.py`, which no route imports.

### 1D. Missing classical techniques (a practicing Bhrigu/Nadi astrologer would expect)

- Divisional charts beyond D9: **D10** (career), D7 (children), D12 (parents), D30 (misfortune), D60 (past karma). D9 itself only in the orphaned engine.
- **Graha drishti** — Vedic special aspects: Mars (4,7,8), Jupiter (5,7,9), Saturn (3,7,10). Nowhere computed; endpoint B computes Western aspects instead.
- **Gochara/transits and Sade Sati** — no live transit computation; `rule_engine._eval_transit_hit` (`:402-413`) is a stub returning `False`.
- **Ashtakavarga** (BAV/SAV) — none.
- **Shadbala** (six-fold planetary strength) — none.
- **Combustion, planetary war, retrograde in the live engine, exact exaltation/debilitation degrees** — none live (retrograde exists only in orphaned engine C).
- **Karakas / Jaimini** — Atmakaraka, Chara karakas, Arudha lagna, Badhaka — string mentions only.
- **Nadi-specific machinery**: Nadi Amsa (150-division), Jeeva/Karya karaka methodology, Bhrigu Nandi Nadi planetary-conjunction chains, progression of Jupiter (BNN's core timing tool) — none implemented; present only as prose in fabricated YAML/markdown.
- **Pratyantardasha** — nowhere; antardasha only in orphaned code.

---

## PILLAR 2 — Token efficiency

### Root cause of "one result uses all tokens"

- One report = **8–13 separate LLM calls** (one per section): `backend/services/bhrigu_predictions.py:1560-1597` loops over `SECTION_SPECS` (karmic_journey 8, past_lives 9, future_lives 9, present_life 10, relationships 11, life_events **13**, karmic_remedies 13). Four categories add an extra synthesis call (`_generate_complete_analysis`, `:1362,1397`). Auto-repair (`_auto_repair_sections`, `:2068` → `section_parser.py:695`) re-calls the LLM for any section judged short — a second round.
- **Quota is counted twice per call**: reserve `prompt_estimate + 2048` (`openai_service.py:575,592`) then `update_usage_after_call(actual_total_tokens)` **adds actual usage on top** (`openai_service.py:638`). Verified in source. Each ~2.5k-token call is charged ~6.5k.
- **Net: one uncached `life_events` report ≈ 84,000 tokens counted against a 100,000/day quota** (`USER_DAILY_TOKEN_LIMIT`, `ai_quota.py:295`). This is exactly the reported symptom.

### Compounding waste

- Main path passes **no `max_tokens`** → every section call reserves/permits the full 2048 default (`openai_service.py:551`; `bhrigu_predictions.py:1575`) even for ~350-token sections. The tiered caps that already exist (`ai_service.py:68,119,179` — 1500/800/600) are not used by the report path.
- **Prefix caching is defeated** despite the prior "cache-stable prompts" commit: the stable system message is ~120–180 tokens (below OpenAI's ~1024 minimum), and `augmented_prompt = context_block + prompt` (`openai_service.py:306`) puts *volatile* corpus/birth data **before** the ~700-token stable instruction block → zero cache hits across the 8–13 sibling calls.
- ~450 static tokens (`bhrigu_base_principles` + `formatting_rules`, `bhrigu_predictions.py:87,292,1441-1445`) re-sent in all 13 calls (~5,850 redundant tokens/request).
- **Dead optimization code**: `prompt_optimizer.py` (claims 40–60% reduction), `response_polisher.py`, `prediction_prompts.py::UserFriendlyPromptBuilder`, and the TTL-aware Redis `prediction_cache.py` are all **unwired** (only tests/health-check import them). The active cache is the SQLAlchemy `BhriguPredictionCache` (`models.py:14`) — whole-category granularity, **no TTL**, so a cache miss regenerates all 13 calls.
- **Frontend makes its own direct OpenAI calls with NO max_tokens**: `frontend/lib/engines/presentLifeEngine.ts:818`, `futureLivesEngine.ts:678` (via `frontend/app/api/predictions/*/route.ts`) — duplicating categories the backend already generates. Unbounded output + double generation.
- `comprehensive_prediction_service.py` calls `self._generate_ai_synthesis(...)` at 8 sites (`:207,257,…,592`) but **the method is never defined** — every call raises AttributeError, silently swallowed.
- Cost guard `PER_REQUEST_COST_LIMIT` ($1) is checked per *call* (~$0.0015 each) — never trips on a 13-call storm; no request-level circuit breaker; per-call retries (2× on 429/5xx) can storm across all sibling sections.

### Token math

| State | Tokens counted per life_events report |
|---|---|
| Today | ~84,000 |
| After fixing double-count | ~32,500 |
| After single structured call per category | **~6,000–8,000 (≈92% reduction)** |

---

## PILLAR 3 — Specificity & precision

1. **Computed precision is dropped before the prompt.** `astrology_calculator.py:355-376` computes `planets` (longitudes), `houses`, `nakshatra_pada`, `nakshatra_lord`, `dasha_period`; the prompt whitelist `_format_birth_details` (`bhrigu_predictions.py:1404-1425`) keeps only scalars (signs, generic positions) and **silently drops degrees/houses/pada**. The same prompt then demands: "Reference specific planetary combinations and yogas from the chart" (`:1454-1467`) — placements the model was never given. **This is a structural invitation to hallucinate.**
2. **Category prompts inject 2–4 fields only** — `openai_service.py:768-785, 808-826, 898-914, 932-946`; the orchestrator generic prompt is worse (`prediction_orchestrator.py:802-812`: sign, nakshatra, moon sign only). No degrees, pada, antardasha, transits, or divisional charts anywhere in prompts.
3. **The only real timing engine is dead code.** `comprehensive_prediction_service.py:377-408` computes dasha timelines and `calculate_life_events_timing` — imported by no route. Marketing text promises "month-level accuracy" (`bhrigu_predictions.py:98`) that the live path cannot produce.
4. **Prompts contradict themselves on precision** — `prediction_prompts.py:100-110`: life_events guidance says `avoid: 'specific date predictions'`, `emphasize: 'general timeframes'` — vagueness mandated for exactly the category whose product is dates; present_life says the opposite (`:56-66`).
5. **No grounding validation** — `vedic_terminology_validator.py` checks vocabulary only (never cross-checks claimed placements vs `chart_data`) and is wired only into the RAG route (`detailed_predictions.py`), not the live orchestrator path. Nothing catches "Saturn in the 7th delaying marriage until 2027" invented from thin air.
6. **Silent degradation to generic text** — any API/quota/cost error returns `_fallback_prediction` (`openai_service.py:323,325,342`); orchestrator falls back to offline templates (`prediction_orchestrator.py:269-272,387-390`; default `mode='hybrid'`, `predictions_routes.py:375`). Offline text is keyed only to sun sign + nakshatra, with fabricated constants ("Evolution Progress: 60-70% complete", "7-12 incarnations remaining", `prediction_orchestrator.py:882-898`) and even a wrong-category output (life_events result contains past-lives content — `backend/test_outputs/life_events_test_result.json`). **No `fallback/offline/partial` flag is surfaced to the UI.**
7. **Nondeterminism** — temperature 0.7, no `seed` (`openai_service.py:565`); `response_polisher.py:397` appends `random.choice(...)` filler. Polisher also strips bold (dates/planet emphasis) (`:74`), truncates at word caps (`:222-244`), and down-levels vocabulary — optimizing Flesch score over density.
8. **Truncation & parser damage** — 2048-token cap vs categories requiring 10 sections × ≥250 words → later sections cut (only a `partial` boolean records it, `openai_service.py:652`); `section_parser.py:144` discards sections <100 chars (penalizing concise precise lines) and `generate_missing_section` **fabricates** filler; on parse failure the whole raw text is inlined into every section slot (`:308-317`).
9. **Literal placeholder in a live prompt** — `predictions_routes.py:365` sends the literal string "- Relevant house positions" to the model instead of actual house data.

---

## PILLAR 4 — Reloads, loops, smoothness

1. **[CRITICAL] Every keystroke triggers a new prediction generation.** `frontend/lib/hooks/useBhriguPrediction.ts:401` — `loadPrediction` depends on `question`; the mount effect (`:419-440`) depends on `loadPrediction`; the question input has no debounce (`BhriguPredictionView.tsx:994-996`). Typing "career" ≈ 6 generation POSTs, each a cache miss (question is in the cache key, `:157-160`). The 4-concurrent request queue throttles but does not dedupe.
2. **[CRITICAL] Double generation on every mount.** Two independent effects both call `loadPrediction`: `useBhriguPrediction.ts:419-440` (localStorage hash) and `BhriguPredictionView.tsx:547-565` (IndexedDB hash) → two identical POSTs per page visit.
3. **[HIGH] Web workers are dead code** — `workerRef` never assigned (`BhriguPredictionView.tsx:422`); no `new Worker(...)` anywhere; `frontend/app/workers/*.ts` never imported. Full-analysis regex parsing runs synchronously on the main thread (`:807-819`) every time `full_analysis` changes → jank. The `postMessage` branch is unreachable and has no `onmessage` handler.
4. **[HIGH] Retry amplification** — axios interceptor retries 3× (`frontend/lib/api.ts:176-194`) *nested inside* `retryWithBackoff` 2× (`useBhriguPrediction.ts:295-325`) → up to 9 attempts, ~40s+ stuck loading. `resilientFetch.ts` is a third layer on a separate path.
5. **[HIGH] Hard reload on 401** — `frontend/lib/api.ts:111-114,161-172` → `window.location.assign('/unlock')` full document reload instead of client-side routing.
6. **[MEDIUM] Aggressive SW update policy** — `sw.js:71-76,92-95` skipWaiting+claim mid-session; `PWAInstaller.tsx:22-24` polls for updates every 60s. No reload loop (handler only logs) but version-skew risk. Predictions are POSTs, not SW-cached (safe).
7. **[MEDIUM] Latent loop hazards** — `usePredictions.ts:49` recreates its API client + callbacks every render (any effect consumer would loop); sibling pages create a new `profile` object identity per load (`bhrigu-predictions/karmic-journey/page.tsx:19-34`) which can re-fire the view's `[profile, encryptionKey]` effect; `sectionExpansionStore` (zustand) is dead code duplicated by local state.

---

# THE MASTER ACTION PLAN

Ordered by dependency and impact. Phases 1–2 stop the bleeding; 3–4 deliver the precision goal; 5–6 deliver full classical completeness.

## Phase 1 — Stop the token hemorrhage (days)

| # | Action | Where | Impact |
|---|---|---|---|
| 1.1 | Fix quota double-count: reconcile reservation with actual (`adjust by actual − estimated`) instead of adding actual on top | `openai_service.py:638`, `ai_quota.py` | ~50% quota reduction immediately |
| 1.2 | Collapse 8–13 section calls into **one structured JSON call per category** (JSON mode already exists, `openai_service.py:541-547`) | `bhrigu_predictions.py:1560-1597` | 8–13× fewer calls; report drops to ~6–8k tokens |
| 1.3 | Pass explicit tiered `max_tokens` on the report path (reuse `ai_service.py` tiering) | `bhrigu_predictions.py:1575` | Stops 2048-reservation per section |
| 1.4 | Real prefix caching: move stable ~700-token category instructions + base principles into the `system` message; volatile corpus/birth data last | `openai_service.py:264-306`, `bhrigu_predictions.py:1427-1470` | Cache-eligible prefix ≥1024 tokens |
| 1.5 | Delete the extra `_generate_complete_analysis` LLM call — compose the summary locally from generated sections | `bhrigu_predictions.py:1362,1397` | −1 call for 4 categories |
| 1.6 | Add request-level circuit breaker: cap total LLM calls/tokens per user request; abort siblings after repeated 429s | `openai_service.py`, orchestrator | No more retry storms |
| 1.7 | Remove or cap frontend direct-OpenAI engines (add `max_tokens`; ideally delete and route through backend so caching/quota apply) | `frontend/lib/engines/presentLifeEngine.ts:818`, `futureLivesEngine.ts:678` | Ends unbounded double generation |
| 1.8 | Wire TTL into result caching (adopt the existing Redis `prediction_cache.py` or add TTL to `BhriguPredictionCache`); cache at section/report level so repair doesn't regenerate everything | `models.py:85-207`, `prediction_cache.py` | Fewer cold regenerations |
| 1.9 | Delete or wire dead code: `prompt_optimizer.py`, `response_polisher.py` (see 3.6), `UserFriendlyPromptBuilder`, `consciousness_ai.py`, undefined `_generate_ai_synthesis` (8 call sites in `comprehensive_prediction_service.py`) | various | Maintenance drag → zero |

## Phase 2 — Kill the loops and jank (days)

| # | Action | Where |
|---|---|---|
| 2.1 | Debounce the question input (500–800ms) AND remove `question` from `loadPrediction`'s dependency chain — generate only on explicit submit | `useBhriguPrediction.ts:401,419-440`, `BhriguPredictionView.tsx:994-996` |
| 2.2 | Collapse the two duplicate mount effects into one profile-check path (pick the encrypted IndexedDB one) | `useBhriguPrediction.ts:419-440` + `BhriguPredictionView.tsx:547-565` |
| 2.3 | Add in-flight request dedupe (same cache key → same promise) + AbortController on unmount | `useBhriguPrediction.ts` |
| 2.4 | Either instantiate the workers properly (with `onmessage`) or delete them and memoize `parseFullAnalysisIntoSections` off the render path | `BhriguPredictionView.tsx:422,807-827`, `frontend/app/workers/*` |
| 2.5 | Single retry layer: remove `retryWithBackoff` around calls already retried by the axios interceptor; never retry non-idempotent generation POSTs more than once | `frontend/lib/api.ts:176-194`, `useBhriguPrediction.ts:295-325` |
| 2.6 | Replace `window.location.assign('/unlock')` with client-side `router.push` preserving state | `frontend/lib/api.ts:111-114,161-172` |
| 2.7 | Tame SW: drop the 60s `registration.update()` poll (rely on navigation checks), reconsider skipWaiting-on-install | `PWAInstaller.tsx:22-24`, `sw.js:71-95` |
| 2.8 | Fix latent hazards: memoize `PredictionsAPI` (`usePredictions.ts:49`), stabilize profile identity in category pages, delete dead `sectionExpansionStore` | various |

## Phase 3 — Correct the astronomy (the foundation) (1–2 weeks)

| # | Action | Where |
|---|---|---|
| 3.1 | **Replace the live chart engine with real sidereal Swiss Ephemeris**: adopt the orphaned `app/services/ephemeris.py` code into the Flask path (pyswisseph, `swe.set_sid_mode(SIDM_LAHIRI)`, `FLG_SIDEREAL`), or fix engine A to use pyswisseph. Kill the hand-rolled ayanamsa (`astrology_calculator.py:682-697`) and fake ascendant (`:613-616`) | `backend/services/astrology_calculator.py` ⇐ `app/services/*` |
| 3.2 | Fix `/birthchart` endpoint: sidereal + whole-sign/equal houses, drop Uranus/Neptune/Pluto and Western aspects, add graha drishti | `backend/api_birthchart.py:198,228,270-295` |
| 3.3 | Correct Vimshottari: birth-nakshatra balance + antardasha + pratyantardasha with real date ranges (port `app/services/dasha.py` + `vedic_calculation_engine.py:295-386`) | replace `astrology_calculator.py:655-680` |
| 3.4 | Emit a complete chart schema every engine/rule needs: per-planet `{sign, house, degree, nakshatra, pada, retrograde, combust, dignity}`, houses with lords, lagna, D9 | chart engine output |
| 3.5 | One engine, one truth: after 3.1–3.4, delete the two superseded engines; add golden-value regression tests against known ephemeris data (several birth dates across decades) | tests |
| 3.6 | Determinism & fidelity: temperature ~0.3 + `seed` param; remove `random.choice` filler, bold-stripping, and word-cap truncation from any polisher kept | `openai_service.py:565`, `response_polisher.py:74,222-244,397` |

## Phase 4 — Deliver real precision (1–2 weeks, after Phase 3)

| # | Action | Where |
|---|---|---|
| 4.1 | Inject the full computed chart into prompts: per-planet sign/house/degree/nakshatra+pada table, active yogas, dasha/antardasha table **with date ranges**, current major transits | `bhrigu_predictions.py:1404-1425`, `openai_service.py:768-946`, `prediction_orchestrator.py:802-812` |
| 4.2 | Wire `comprehensive_prediction_service` (dasha timelines, `calculate_life_events_timing`) into the live routes — or feed its output into prompt context | `comprehensive_prediction_service.py:377-408` + routes |
| 4.3 | Resolve the precision contradiction: remove `avoid: 'specific date predictions'` for life_events; instruct dasha-anchored date ranges + age spans, with honest confidence language | `prediction_prompts.py:100-110` |
| 4.4 | Add a chart-grounding validator in the live path: verify every claimed placement/yoga/dasha in the LLM output against computed `chart_data`; regenerate or flag mismatches | extend `vedic_terminology_validator.py`; wire into orchestrator (not just RAG route) |
| 4.5 | Surface degradation honestly: propagate `fallback/offline/partial` flags to the UI with a visible badge; never present canned sun-sign text as a full reading | `openai_service.py:323-342`, orchestrator, frontend prediction views |
| 4.6 | Fix section parser: lower/remove the 100-char minimum, stop fabricating missing sections, stop inlining raw text into every slot on parse failure; raise output budget for the single structured call | `section_parser.py:144,308-320` |
| 4.7 | Remove the literal placeholder "- Relevant house positions" and pass actual house data | `predictions_routes.py:365` |
| 4.8 | Fix the wrong-category output bug (life_events serving past-lives content) | offline generators / `category_specific_offline_predictions.py` |
| 4.9 | Rebuild offline fallbacks from the chart, not sun-sign templates: once 3.4 exists, drive offline text from real placements + rule engine, delete fabricated constants ("60-70% complete", "7-12 incarnations") | `prediction_orchestrator.py:624-898`, `category_specific_offline_predictions.py:88-99` |

## Phase 5 — Make the classical rule system real (2–4 weeks)

| # | Action | Where |
|---|---|---|
| 5.1 | Fix the rule DSL contract: with 3.4's chart schema, `planet_in_house` etc. finally evaluate; unify the two contradictory "does this rule apply" implementations (empty conditions must NOT mean "always applies") | `rule_engine.py:200-206`, `bhrigu_nadi_core_engine.py:309-324`, `principle_loader.py:47-48` |
| 5.2 | Migrate per-category rule files to the engine schema (`triggers` + `narrative_template`) so `core_wisdom/bhrigu_samhita/rules/*.json` actually evaluate | `bhrigu_core_wisdom.py:80-89,178-186` |
| 5.3 | **Replace fabricated principle data with genuine classical content**: re-source `bhrigu_samhita_principles.yml` / ND-*/BS-* markdown from real texts (Bhrigu Samhita translations, Bhrigu Nandi Nadi — R.G. Rao, Deva Keralam / Chandra Kala Nadi, BPHS for the general framework), each rule with machine-checkable conditions + honest citation | `backend/data/*`, `core_wisdom/*` |
| 5.4 | Wire `vedic_yogas_calculator.py` into the live path AND fix hardcoded `active: True` yogas to real lordship/placement checks (Raja, Dhana, Panch Mahapurusha, Gajakesari, Kemadruma, Sunapha/Anapha/Durudhara, Adhi, Vesi/Vasi, Amala, Kaal Sarpa, Manglik) | `vedic_yogas_calculator.py:161-719` |
| 5.5 | Implement graha drishti (Mars 4/7/8, Jupiter 5/7/9, Saturn 3/7/10 + full 7th for all) as first-class chart data usable by rules and prompts | chart engine |
| 5.6 | Implement gochara: current transits vs natal chart, Sade Sati detection (Saturn vs natal Moon), Jupiter/Saturn/Rahu-Ketu transit significance; replace the `_eval_transit_hit` stub | `rule_engine.py:402-413` + new transit service |
| 5.7 | Load the skipped YAML sections (`remedies`, `matchmaking_criteria`) and key remedies to real chart afflictions (functional malefics, dasha lords) rather than static lists | `principle_loader.py:207`, `vedic_calculation_engine.py:483-722` |

## Phase 6 — Classical completeness: the full textbook (ongoing)

Priority order for new classical modules (each: compute → expose in chart schema → rules → prompts):
1. **Divisional charts**: D10 (career), D7, D12, D30, D60 (Bhrigu tradition leans heavily on D60 for past karma) — extend the D9 code in `app/services/ephemeris.py:257-308`
2. **Ashtakavarga** (BAV + SAV) — transit strength scoring, needed for timing precision
3. **Shadbala** — planetary strength to weight rule outcomes and yoga potency
4. **Jaimini karakas** — Atmakaraka, chara karakas, Arudha lagna; Badhaka houses/lords
5. **Nadi-specific machinery** (the app's namesake): Bhrigu Nandi Nadi planetary-conjunction chains, **progression of Jupiter** (BNN's primary timing tool — 1 sign/year), Jeeva/Karya karaka analysis, Nadi Amsa (150 divisions) as data permits
6. **Refinements**: combustion/planetary-war flags, exact exaltation-degree dignity, bhava-madhya vs whole-sign house options, Chandra-lagna and Surya-lagna parallel readings (classic Bhrigu practice: read from Moon as well as Lagna)

## Cross-cutting (do throughout)

- **Tests**: golden ephemeris regression tests (multiple decades), dasha date-range tests, yoga-detection fixtures, quota-accounting unit tests, frontend effect-loop tests (mount fires exactly one generation).
- **Cleanup**: the repo carries ~40 stale root-level status MDs, three engines, duplicate services, test-output JSONs committed to git — prune aggressively once phases land.
- **Honesty in claims**: align marketing strings ("month-level accuracy", "500 principles applied") with what the engine actually computes at each phase.

---

## Suggested sequencing summary

**Week 1:** Phase 1 (token) + Phase 2 (loops) — user-visible cost and smoothness fixed.
**Weeks 2–3:** Phase 3 (correct sidereal engine — everything else depends on it).
**Weeks 3–4:** Phase 4 (precision into prompts + grounding validator).
**Weeks 5–8:** Phase 5 (real rule engine + genuine classical data).
**Ongoing:** Phase 6 modules in priority order, each shipped with tests.
