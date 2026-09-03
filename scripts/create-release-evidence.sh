#!/usr/bin/env bash
set -euo pipefail

: "${ENVIRONMENT_ID:?Set a non-secret environment identity.}"
: "${CONFIG_REVISION:?Set the non-secret deployment configuration revision.}"
: "${FEATURE_FLAG_REVISION:?Set the non-secret feature-flag revision, or 'none'.}"
: "${ARTIFACT_PATH:?Set the built artifact path.}"

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "Release evidence requires a clean source revision." >&2
  exit 1
fi

if [[ ! -e "$ARTIFACT_PATH" ]]; then
  echo "Artifact path does not exist: $ARTIFACT_PATH" >&2
  exit 1
fi

digest_path() {
  local path="$1"
  if [[ -f "$path" ]]; then
    sha256sum "$path" | awk '{print $1}'
    return
  fi

  (
    cd "$path"
    find . -type f -print0 | sort -z | xargs -0 sha256sum
  ) | sha256sum | awk '{print $1}'
}

source_revision=$(git rev-parse HEAD)
lockfile_digest=$(sha256sum package-lock.json | awk '{print $1}')
migration_set_digest=$(find db/migrations -maxdepth 1 -type f -name '*.sql' -print0 | sort -z | xargs -0 sha256sum | sha256sum | awk '{print $1}')
artifact_digest=$(digest_path "$ARTIFACT_PATH")
build_id=$(tr -d '\n' < .next/BUILD_ID)
timestamp=$(date --utc +%Y-%m-%dT%H:%M:%SZ)
output_path="${EVIDENCE_OUTPUT_PATH:-verification/release-evidence-${source_revision}.json}"

mkdir -p "$(dirname "$output_path")"

SOURCE_REVISION="$source_revision" \
LOCKFILE_DIGEST="$lockfile_digest" \
MIGRATION_SET_DIGEST="$migration_set_digest" \
ARTIFACT_DIGEST="$artifact_digest" \
BUILD_ID="$build_id" \
TIMESTAMP="$timestamp" \
OUTPUT_PATH="$output_path" \
node <<'NODE'
const fs = require("node:fs");

if (fs.existsSync(process.env.OUTPUT_PATH)) {
  throw new Error(`Refusing to overwrite existing evidence: ${process.env.OUTPUT_PATH}`);
}

const evidence = {
  evidenceId: `release-candidate:${process.env.SOURCE_REVISION}:${process.env.BUILD_ID}`,
  timestamp: process.env.TIMESTAMP,
  owner: "release-engineering",
  environment: process.env.ENVIRONMENT_ID,
  releaseCandidate: {
    sourceRevision: process.env.SOURCE_REVISION,
    lockfileSha256: process.env.LOCKFILE_DIGEST,
    buildIdentity: process.env.BUILD_ID,
    artifactSha256: process.env.ARTIFACT_DIGEST,
    migrationSetSha256: process.env.MIGRATION_SET_DIGEST,
    configurationRevision: process.env.CONFIG_REVISION,
    featureFlagRevision: process.env.FEATURE_FLAG_REVISION
  },
  procedure: "scripts/create-release-evidence.sh",
  observedOutcome: "Release-candidate identity recorded. This is not runtime verification."
};

fs.writeFileSync(process.env.OUTPUT_PATH, `${JSON.stringify(evidence, null, 2)}\n`, {
  encoding: "utf8",
  mode: 0o600
});
NODE

echo "Release evidence written to $output_path"
