# Interactive API Playground (Swagger UI)

Use the Swagger UI playground to explore BhriguWelt endpoints, inspect schemas, and send live requests against your local or hosted backend.

## Quick start
1. Start the backend (defaults to port 8000):
   ```bash
   cd backend
   python -m bhriguwelt.async_api
   ```
2. Serve the docs directory so the browser can load the OpenAPI spec:
   ```bash
   cd docs
   python -m http.server 8001
   ```
3. Open the playground:
   ```
   http://localhost:8001/swagger-ui.html
   ```
4. Click **Try it out** on any endpoint, fill in the request body, and send the request.

## What the playground includes
- The OpenAPI contract from `docs/openapi.yaml`.
- Live request execution against the backend URL shown in the `servers` section of the spec.
- Auto-generated request/response schemas for quick validation.

## Tips
- Update the `servers` section in `docs/openapi.yaml` if you want Swagger UI to point at a different host.
- If you run into CORS errors, confirm the playground is served over HTTP (not `file://`) and the API is reachable.
- Use `docs/openapi-examples.md` for example payloads to paste into the request body.

## Troubleshooting
- **Blank UI:** confirm `swagger-ui.html`, `swagger-ui.config.js`, and `openapi.yaml` are in the same `docs/` directory.
- **Network errors:** ensure the API is running and the `servers` URL matches the host and port.
- **Schema mismatch:** re-open the browser tab after regenerating `openapi.yaml` so the latest version is loaded.
