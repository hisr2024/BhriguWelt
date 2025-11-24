# Repository administration follow-ups

This environment cannot access the GitHub settings UI, so certain repository administration tasks remain manual. Please complete
the following in GitHub after pulling these changes:

## Status from this commit

- `pre-commit install` was invoked from the repository root, but fetching the `pre-commit` package failed because the package
  index could not be reached from the build network. Install `pre-commit` locally (for example, via `pip install pre-commit`)
  and rerun `pre-commit install` so Black, mypy, and the Next.js lint/type-check hooks from `.pre-commit-config.yaml` activate
  on commits.
  - Once `pre-commit` is available, you can run `pre-commit run --all-files` to exercise the same hooks on demand.
  - Share these notes with any new contributor or CI runner so the hooks stay consistently enforced.

1. **Install pre-commit locally**
   - Ensure `pre-commit` is available in your shell (e.g., `pip install pre-commit`).
   - From the repository root, run `pre-commit install` so the Black, mypy, and Next.js lint/type-check hooks defined in
     `.pre-commit-config.yaml` are enforced on commits.

2. **Set GitHub topics**
   - In **Settings → General → Topics**, add: `astrology`, `python`, `nextjs`, `bhrigu-samhita`, `hindu-astrology`.

3. **Enable planning surface**
   - Either turn on the GitHub **Projects** board or enable the **Wiki**. Use it to track UI/i18n expansions, deployment
     milestones, and the roadmap referenced in the README.

These steps could not be executed automatically from the container due to limited permissions and network restrictions, but
completing them in GitHub will align the repository with the documented quality and planning guidelines.
