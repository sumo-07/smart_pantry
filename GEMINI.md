# Workspace Rules

## Git, Staging & Production Deployment Protocol

1. **Branching Strategy (Always Branch off `staging`)**:
   - The primary integration branch is `staging`.
   - For every feature, bugfix, or issue resolution, create an isolated branch (e.g., `fix/...` or `feature/...`) branched off `staging`.
   - Use Git worktrees for parallel agents and keep worktrees alive for local manual testing.

2. **Automated Reviewer / Verifier Agent**:
   - Once authoring code changes are complete and a Pull Request is submitted, an independent **Reviewer / Verifier Agent** must automatically run.
   - The Reviewer Agent:
     - Pulls and inspects the complete `git diff`.
     - Executes project builds, test suites, or syntax validations (`npm test`, `npm run build`, `pytest`, etc.).
     - Validates code quality, edge cases, and performance impact.
     - Posts a structured Code Review Report to the PR and presents it to the user.

3. **Two-Stage Approval & Merging Protocol**:
   - **Stage 1 (Merge to `staging`)**:
     - Present the PR, diff summary, and Reviewer Agent report to the user.
     - Ask for user approval to merge into **`staging`**.
     - Once approved, merge the feature branch into `staging`.
   - **Stage 2 (Final Merge to `main` / Production)**:
     - Integration and local manual testing happen on `staging`.
     - **NEVER merge `staging` into `main` without explicit user confirmation.**
     - Only when the user explicitly instructs to merge to `main`, execute the merge from `staging` into `main` with a structured commit message (e.g., `feat(scope): ...` or `fix(scope): ...`).
     - Clean up temporary branches and worktrees only after the final merge to `main` is approved and completed.
