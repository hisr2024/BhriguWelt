# Repository administration follow-ups

This environment cannot access the GitHub settings UI, so certain repository administration tasks remain manual. Please complete the following in GitHub after pulling these changes:

1. **Install pre-commit locally**
   - Ensure `pre-commit` is available in your shell (e.g., `pip install pre-commit`).
   - From the repository root, run `pre-commit install` so the Black, mypy, and Next.js lint/type-check hooks defined in `.pre-commit-config.yaml` are enforced on commits.

2. **Set GitHub topics**
   - In **Settings → General → Topics**, add: `astrology`, `python`, `nextjs`, `bhrigu-samhita`, `hindu-astrology`.

3. **Enable planning surface**
   - Either turn on the GitHub **Projects** board or enable the **Wiki**. Use it to track UI/i18n expansions, deployment milestones, and the roadmap referenced in the README.

These steps could not be executed automatically from the container due to limited permissions and network restrictions, but completing them in GitHub will align the repository with the documented quality and planning guidelines.
