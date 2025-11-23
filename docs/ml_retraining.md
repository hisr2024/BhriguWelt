# ML weighting retraining guide

This service supports a feedback-driven ML weighting pipeline that can be refreshed by operators when new feedback arrives.

## Triggering retraining

- **Admin API:** `POST /ml/retrain` requires the `X-Admin-Token` header matching `BHRIGUWELT_ADMIN_TOKEN`. An optional JSON body can include `{"limit": 500}` to cap the most recent feedback rows used during training. Successful calls return the latest metrics and clear cached responses so new weights take effect immediately.
- **CLI:** `python -m bhriguwelt.scripts.train_ml [--limit N] [--verbose]` executes the same retraining logic for offline or scheduled use. Verbose mode turns on debug logging to stream telemetry to stdout.

Retraining writes both the serialized model and a JSON metadata manifest atomically under `backend/src/bhriguwelt/models/`. If anything fails during the write step, the previous artifacts remain intact.

## Telemetry and health checks

- Accuracy, sample counts, and feature drift counts (new vs. dropped features) are logged after every retrain and whenever model metadata is loaded on startup. Failures are captured for telemetry and surfaced in `GET /health` under the `ml` key, which includes the last retrain or load error when present.

## Operational toggles and cadence

- Set `BHRIGUWELT_ADMIN_TOKEN` to a strong secret to enable the admin retrain endpoint.
- Set `BHRIGUWELT_DISABLE_ML_WEIGHTING=true` to temporarily fall back to deterministic weighting without applying trained coefficients. Clearing the variable re-enables trained parameters.
- The `scoring.ml_trained_parameters` block in `backend/src/bhriguwelt/config.py` provides the default weights; operators can override them via the runtime YAML config or by invoking retraining.
- Recommended cadence: retrain weekly when new feedback is flowing, or immediately after significant feedback spikes. Use the `limit` parameter to bias toward the most recent few hundred entries when drift is suspected.

