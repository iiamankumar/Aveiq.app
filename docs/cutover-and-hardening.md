# Cutover and Hardening

## Staging validation checklist

- Run lint, build, and test in CI and staging-like environment.
- Validate parity matrix `must-have` feature status.
- Verify compatibility adapters are no longer required.

## Cutover tasks

- Replace adapter-dependent routes with native target contracts.
- Freeze source-of-truth data synchronization.
- Enable production runtime and observability configuration.

## Hardening

- Remove temporary compatibility code from `packages/compat`.
- Lock acceptance criteria with signed-off source inventory references.
- Finalize deployment and rollback runbook.
