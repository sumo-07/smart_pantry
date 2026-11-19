# Workspace Rules

## Git, Multi-Agent & Staging-to-Main Protocol

1. **Branching & Staging Strategy**:
   - The primary integration branch is `staging`.
   - Feature branches and bug fixes are developed on isolated branches / Git worktrees branched off `staging`.
   - Multiple commits or fixes can be batched on the feature branch.
   - Once ready, the feature branch is merged into `staging`.

2. **Pre-Merge Reviewer / Verifier Agent**:
   - The Reviewer Agent runs **before merging into `main`** (or whenever explicitly requested by the user). It does not interrupt intermediate fixes during authoring.
   - Responsibilities:
     - Inspect the accumulated `git diff` of `staging` against `main`.
     - Verify code quality, potential regressions, edge cases, and performance impact.
     - Execute the project's build, test suites, or syntax validations (`npm test`, `npm run build`, `pytest`, etc.).
     - Post a structured Code Review Report to the user.

3. **Keep Worktree Alive for Local Manual Testing**:
   - **Do NOT delete or remove the Git worktree before merge to `main`.**
   - Keep the worktree directory alive and intact on `staging` so the user can perform local manual testing (e.g., launching local dev servers, testing API endpoints, verifying UI).
   - Inform the user of the exact worktree path and instructions for running/testing it locally.

4. **User Confirmation & Final Merge to `main`**:
   - Present the PR/diff summary, Reviewer Agent report, and worktree path to the user.
   - **Never merge into `main` without explicit user confirmation.**
   - Upon receiving explicit user approval, merge `staging` into `main` with a structured commit message (e.g. `feat(scope): ...` or `fix(scope): ...`).
   - Clean up any temporary feature branches and Git worktrees only after the merge is confirmed and manual testing is finished.
