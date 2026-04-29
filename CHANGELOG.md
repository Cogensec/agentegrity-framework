# Changelog

All notable changes to the Agentegrity Framework are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
Pre-1.0 minor versions may contain breaking changes; the project remains
in beta until the v1.0 stability criteria documented in
[README → Roadmap](README.md#roadmap) are met.

## [Unreleased]

### Changed
- **Default integrity pipeline now has four layers, not three.**
  `RecoveryLayer` joins `AdversarialLayer` / `CorticalLayer` /
  `GovernanceLayer` in the canonical pipeline used by
  `AgentegrityClient` and the framework adapter base class.
- **`PropertyWeights` defaults rebalanced** to give recovery a non-zero
  share: AC=0.35, EP=0.20, VA=0.30, RI=0.15 (was AC=0.40, EP=0.25,
  VA=0.35, RI=0.0).
- README, MANIFESTO, spec, and glossary updated to describe four layers
  consistently. New `spec/layers/recovery-layer.md` normative spec.

### Added
- `agentegrity.layers.default_layers()` factory returning the
  canonical four-layer pipeline. Used internally by every zero-config
  entry point.
- `RecoveryLayer`, `default_layers`, and `PropertyWeights` are now
  re-exported from the top-level `agentegrity` package.
- `scripts/check_versions.py` Python equivalent of the existing
  TypeScript version-parity check. Wired into CI to fail the build on
  drift between `pyproject.toml`, `src/agentegrity/__init__.py`, the
  README shields badge, and present-tense version claims in README
  prose.

### Migration
Callers that constructed `PropertyWeights` with three keyword arguments
will now hit the validator (defaults sum to 1.0, but the new RI=0.15
default puts the legacy AC/EP/VA-only triple over 1.0). Either:

  1. Pass `recovery_integrity=0.0` explicitly to keep three-property
     weighting, or
  2. Adopt the new default by omitting the `weights=` argument
     entirely.

## [0.5.3] - 2026-04-29

### Changed
- Concrete version pins replace `workspace:*` references in TypeScript
  package manifests so published `@agentegrity/*` packages install
  cleanly off-registry.
- GitHub Actions bumped to `actions/checkout@v5`,
  `actions/setup-python@v6`, `actions/setup-node@v5`.
- CI push triggers scoped to `main` plus concurrency cancellation so
  in-flight runs cancel on rapid pushes.
- Repository moved to the `cogensec` org.

### Added
- `AGENTEGRITY_OFFLINE` environment variable so test runs work without
  a reporter target.
- Smoke tests for `createDefaultAdapter` in the TypeScript client
  package.

## [0.5.0] - 2026-03-?

### Added
- **Six TypeScript framework adapters.** `@agentegrity/claude-sdk`,
  `@agentegrity/langchain`, `@agentegrity/openai-agents`,
  `@agentegrity/crewai`, `@agentegrity/google-adk`, plus the
  TypeScript-native `@agentegrity/vercel-ai` (no Python equivalent;
  uses the AI SDK's OpenTelemetry tracer surface).
- `createDefaultAdapter()` shared helper in `@agentegrity/client` that
  every framework adapter wraps. Owns lifecycle, exporter fan-out,
  fail-open guarantees, and `process.beforeExit` shutdown.
- `clients/typescript/scripts/check-versions.ts` keeps every
  `@agentegrity/*` package version aligned with `pyproject.toml`.
- Release workflow publishes the seven npm packages in a matrix.

## [0.4.0] - 2026-?

### Added
- **`SessionExporter` hook + cross-language wire format.**
  `register_exporter()` on every Python adapter; live session data
  (session_start, every evaluated event, session_end) streams as
  JSON-ready dicts to subscribed exporters, fail-open so a broken
  exporter never breaks the agent.
- JSON Schema definitions under `schemas/exporter/` and OpenAPI 3.1
  under `schemas/openapi.yaml` for the exporter wire format.
- First-party TypeScript client (`@agentegrity/client`) for emitting
  the same event stream from Bun / Node agents.

## [0.3.0]

### Added
- **Multi-framework adapters.** LangChain / LangGraph, OpenAI Agents
  SDK, CrewAI, and Google Agent Development Kit each ship as a
  `agentegrity.<framework>` Python module with the same three-line
  instrumentation surface as the Claude adapter.
- Shared `_BaseAdapter` so adding a new framework is mostly mechanical.

## [0.2.1]

### Added
- Zero-config `agentegrity.claude` top-level module: `hooks()`,
  `report()`, `reset()` — three-line Claude Agent SDK instrumentation
  with no setup.
- `AgentProfile.default()` factory.
- `python -m agentegrity` info CLI + `doctor` self-check command.

## [0.2.0]

### Added
- **Claude Agent SDK adapter.** First framework integration with five
  hook points (Harness, Tools, Sandbox, Session, Orchestration).
- **LLM-backed cortical checks** (`pip install agentegrity[llm]`):
  Claude-powered semantic analysis of reasoning chains, memory
  provenance, and behavioral drift, fail-open on API errors.
- **`RecoveryLayer`** (initially opt-in; promoted to a default layer
  in v0.5.3-Unreleased).
- **`AsyncIntegrityEvaluator`** running independent layers in parallel
  via `asyncio.gather`.

## [0.1.0]

### Added
- Initial public release.
- Three-layer architecture: `AdversarialLayer`, `CorticalLayer`,
  `GovernanceLayer`.
- Pattern-based reference detectors (substring matching for prompt
  injection indicators, dictionary-based behavioral drift).
- Cryptographic attestation: Ed25519-signed `AttestationRecord`,
  hash-chained `AttestationChain`, deterministic JSON canonicalization.
- Custom validator and policy extension points.
- Three working examples (`basic_evaluation.py`,
  `runtime_monitoring.py`, `custom_validator.py`).

[Unreleased]: https://github.com/cogensec/agentegrity-framework/compare/v0.5.3...HEAD
[0.5.3]: https://github.com/cogensec/agentegrity-framework/releases/tag/v0.5.3
[0.5.0]: https://github.com/cogensec/agentegrity-framework/releases/tag/v0.5.0
[0.4.0]: https://github.com/cogensec/agentegrity-framework/releases/tag/v0.4.0
[0.3.0]: https://github.com/cogensec/agentegrity-framework/releases/tag/v0.3.0
[0.2.1]: https://github.com/cogensec/agentegrity-framework/releases/tag/v0.2.1
[0.2.0]: https://github.com/cogensec/agentegrity-framework/releases/tag/v0.2.0
[0.1.0]: https://github.com/cogensec/agentegrity-framework/releases/tag/v0.1.0
