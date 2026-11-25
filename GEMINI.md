# Workspace Rules

## Pre-Implementation Options & User Decision Protocol

1. **Mandatory Options Presentation**:
   - Never unilaterally implement architectural changes, technical decisions, or significant fixes without prior consultation.
   - For every situation, bug, or design choice:
     - Clearly explain the situation, technical context, and root cause.
     - Present distinct, actionable options with trade-offs.
     - **Wait for the user's explicit choice** before writing or modifying code.
2. **Scope**:
   - Applies across this repository and all conversations in this workspace.

## Git, Staging & Production Deployment Protocol (Milestone PR Flow)

1. **Develop & Test on `staging`**:
   - **`staging`** is the primary working and integration branch.
   - Build, iterate, and test features locally on `staging` (run builds, syntax checks, and tests before committing).
   - Only create an isolated `feature/*` branch or worktree when running parallel agents or isolating a large, risky experiment—do **not** open a separate PR for every small fix or iteration.

2. **1 PR = 1 Complete, Tested Milestone (`staging` → `main`)**:
   - Only open a Pull Request (from **`staging` → `main`**) once a complete feature or milestone has been **tested locally** and is ready for production.
   - If follow-up fixes are needed for that milestone, push them to `staging` (updating the same PR) rather than opening new PRs.

3. **Automated Reviewer / Verifier Agent (Before Merging to `main`)**:
   - When a milestone PR (`staging` → `main`) is opened, run an independent **Reviewer / Verifier Agent** to:
     - Inspect the full `git diff main...staging`.
     - Run project builds, syntax checks, and test suites.
     - Post a structured Code Review Report to the PR and present it to the user.

4. **Production Merge & Post-Release Sync**:
   - **NEVER merge `staging` into `main` without explicit user confirmation.**
   - Merge `staging` → `main` using a standard merge commit (preserves release history and allows 1-command rollback).
   - After merging to `main`, fast-forward `staging` (`git merge main --ff-only`, falling back to regular merge if `main` diverged) so both branches stay 100% in sync, and clean up any temporary branches/worktrees if used.
