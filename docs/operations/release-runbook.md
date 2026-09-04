# Release build and deployment runbook

This runbook defines the handoff from a clean source revision to the deployment operator. It is not evidence that a release was deployed, and it does not authorize bypassing any blocked decision in `blocked-decisions.md`.

## Preconditions

- An approved registry or mirror must provide the patched framework and all pinned package artifacts.
- A real PostgreSQL instance, Redis instance, approved SMS provider, secret delivery path, deployment target, backup/restore owner, and required owner-approved product policies must be available.
- The source checkout must be clean and the revision must be pushed or otherwise retained before building.
- Docker, Playwright browsers, PostgreSQL, Redis, and the approved production credentials must be available in the release environment.

## Reproducible build contract

`BUILD_ID` is an immutable source revision identifier. Locally, `npm run build` derives it from a clean Git checkout. Container builds have no Git metadata by design, so the operator must pass the same value explicitly:

```sh
export BUILD_ID="$(git rev-parse --verify HEAD)"
git diff --quiet && git diff --cached --quiet
npm ci
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
npm run sbom:production
docker build --build-arg BUILD_ID="$BUILD_ID" -t ayan-taraz:"$BUILD_ID" .
```

The resulting `.next/BUILD_ID` must equal `$BUILD_ID`. `verification/sbom.production.cdx.json` is an input to release evidence; it is not a vulnerability assessment.

## Final environment gates

1. Provide all required values from `.env.example` through the approved secret mechanism. Do not commit or bake secrets into the image.
2. Apply migrations only to the designated deployment database, using the approved migration procedure. Verify backup and restore evidence before destructive operations.
3. Run the real PostgreSQL migration/concurrency check and Redis connectivity check against the designated non-production validation environment.
4. Start the exact container image with production-equivalent configuration. Verify `/api/health`, request correlation, security headers, unauthenticated redirects, and all approved critical user journeys with Playwright.
5. Run the production dependency audit against the approved registry and resolve findings before approval.
6. Create release evidence only after the artifact, SBOM, migration set, configuration revision, and environment identity are known:

```sh
ENVIRONMENT_ID=... \
CONFIG_REVISION=... \
FEATURE_FLAG_REVISION=none \
ARTIFACT_PATHS=.next/standalone \
SBOM_PATH=verification/sbom.production.cdx.json \
npm run evidence:release
```

7. Deploy the verified artifact, perform health and critical-path smoke checks, retain the release evidence, and confirm the documented rollback/recovery path before release approval.

Any failed or unverified gate leaves the release **not approved**.
