# Engine-to-Core Analyser Blueprint

## Purpose
- Provide a single integration lane that connects every prediction engine to the platform cores through an **Analyser** layer.
- Standardize how interpretive logic (specialized interpreters, UX designers, main interpreters) consumes engine outputs and returns results to seekers.
- Maximize throughput and accuracy by reducing duplicate validation, normalizing payloads, and routing only clean, context-rich data downstream.

## System roles
- **Engines**: Horoscope, Matchmaking, Life Timeline, Career, Annual Report, Relocation, Hindu calendar conversion, and chat. Each engine focuses on deterministic calculations and rule application.
- **Analyser (orchestrator)**:
  - Validates profile/session context, normalizes DOB/TOB/POB/timezone, and enriches requests with derived markers (mahadasha/antardasha, lagna, planetary strengths).
  - Selects target engines based on requested scope (single, multi-engine bundle, scheduled export) and sequences their execution.
  - Applies cross-engine coherence checks (e.g., career vs. timeline conflicts) and assigns confidence grades.
- **Core services**: Data loader, calculation kernels, profile/session store, alert scheduler, export/PDF service, analytics logger, and cache tier. These remain stateless per request except for persistence and telemetry.
- **Interpreters**:
  - **Specialized interpreters** translate engine sections into human-readable guidance per domain (career, relationship, relocation, spiritual).
  - **Design interpreters** format sections for UI channels (web, PDF, chat) with component tokens (TOC anchors, badges, CTA hints).
  - **Main interpreter** merges sections, removes contradictions, orders content by priority, and prepares a final payload for delivery.
- **Delivery layer**: HTTP/WS API (backend) and Next.js frontend. Receives finalized payloads, triggers chat hand-offs, and manages exports/notifications.

## Data and control flow
1. **Input intake**: Request arrives with person(s), location/timezone, focus areas, and requested engines; Analyser pulls saved profile/session if provided.
2. **Validation & normalization**: Geo/timezone resolution, DOB/TOB validation, approximate-time handling, and rule gating (required fields per engine).
3. **Engine execution**: Analyser dispatches to selected engines with normalized payloads; engines return structured sections with ids, anchors, confidence, and raw metrics.
4. **Cross-engine synthesis**: Analyser compares outputs, flags conflicts, harmonizes terminology, and tags sections for priority/urgency.
5. **Interpretation & design**: Specialized interpreters draft guidance; design interpreters map content to Section Card/TOC/export components; main interpreter assembles the final ordered narrative.
6. **Delivery & feedback**: Payload is sent to API consumers; chat is primed with context; exports/alerts are queued; telemetry records latency, errors, and satisfaction signals for retraining.

## Interface contracts
- **Inbound request schema**: `{ user/profile ids?, session_id?, persons[], dob, tob, pob{text,lat,lon}, timezone, focusAreas[], engines[], options{approxFlag, year, locations[], exportFormat, asyncJob?} }`.
- **Engine response contract**: `{ engine, sections:[{id,title,anchor,content,confidence,metrics,actions}], meta{duration,inputs}, warnings[] }`.
- **Interpreter payload**: `{ sections[], ordering[], contradictions[], exportDirectives[], chatPrimer }`.
- **Delivery payload**: `{ session_id, profile_id, engines_run[], sections[], toc[], exports?, alerts?, telemetry? }`.

## Operational guardrails
- **Performance**: Shared cache for resolved geo/timezone and derived charts; per-engine timeouts with circuit breakers; async fan-out where safe.
- **Reliability**: Idempotent session/profile lookups; retries for export/notification jobs; fallbacks to deterministic rules when an engine is degraded.
- **Observability**: Trace ids propagated from request through Analyser, engines, interpreters, and delivery; metrics on latency, error rates, section confidence, and export success.
- **Governance**: Versioned contracts for engines and interpreters; feature flags for experimental engines; explicit consent flags for telemetry and alerts.

## Output optimization patterns
- **Bundled runs**: For multi-engine journeys (e.g., career + timeline), reuse normalized payloads and share derived chart caches.
- **Consistency filters**: Drop or rewrite sections that conflict with higher-confidence findings; mark low-confidence items with badges for UI clarity.
- **Channel-aware formatting**: Keep Section Card/TOC structure for web; apply condensed templates for chat; generate print-stable variants for PDF/export.
- **Human-in-the-loop**: Allow designers/astrologers to override or reorder sections before publication; capture edits as training signals for interpreters.
