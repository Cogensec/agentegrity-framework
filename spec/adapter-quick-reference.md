# Adapter Quick Reference

Every first-party agentegrity adapter follows the same shape: zero-config by default, import one function, wire it into the framework's callback / hook / telemetry slot, and events stream through any `SessionExporter` you register.

As of v0.5.2 there are **eleven adapters** across two languages.

## Python (five)

Installed with `pip install agentegrity`. Every module re-exports `register_exporter`, `report`, and `reset`.

| Framework | Module | Enable snippet |
|---|---|---|
| Claude Agent SDK | `agentegrity.claude` | `ClaudeSDKClient(options=ClaudeAgentOptions(hooks=claude_hooks()))` |
| LangChain / LangGraph | `agentegrity.langchain` | `graph = instrument_graph(my_graph)` |
| OpenAI Agents SDK | `agentegrity.openai_agents` | `Runner.run(agent, hooks=run_hooks())` |
| CrewAI | `agentegrity.crewai` | `instrument_crew(crew)` |
| Google ADK | `agentegrity.google_adk` | `instrument_agent(agent)` |

## TypeScript (six)

One npm package per framework; all depend on `@agentegrity/client` for the shared `createDefaultAdapter()` helper. Every package re-exports `registerExporter`, `report`, `reset`, and `adapter`.

| Framework | npm package | Enable snippet |
|---|---|---|
| Claude Agent SDK | `@agentegrity/claude-sdk` | `query({ options: { hooks: hooks() } })` |
| LangChain JS | `@agentegrity/langchain` | `new ChatX({ callbacks: [instrument()] })` |
| OpenAI Agents SDK | `@agentegrity/openai-agents` | `run(agent, input, { hooks: runHooks() })` |
| CrewAI JS | `@agentegrity/crewai` | `instrument().attach(crew.events)` |
| Google ADK | `@agentegrity/google-adk` | `const close = instrument(agent)` |
| Vercel AI SDK *(TS-only)* | `@agentegrity/vercel-ai` | `streamText({ experimental_telemetry: instrument() })` |

## Shared guarantees

All eleven adapters conform to the same contract:

- **Zero-config**: reads `AGENTEGRITY_URL` and `AGENTEGRITY_TOKEN` from the environment. No explicit client wiring required.
- **Kill switch**: `AGENTEGRITY_DISABLED=1` (or `AGENTEGRITY_DISABLE=1`) bypasses the adapter entirely.
- **Fail-open**: exporter exceptions are caught and logged; the instrumented agent never breaks because of the adapter.
- **Event vocabulary**: every adapter maps framework-specific hooks onto the seven canonical event types (`user_prompt_submit`, `pre_tool_use`, `post_tool_use`, `post_tool_use_failure`, `subagent_start`, `subagent_stop`, `stop`) defined in `schemas/exporter/`.
- **Idempotent**: instrumenting the same agent / graph / emitter twice is a no-op.
- **Version parity**: Python `pyproject.toml` and every `@agentegrity/*` package publish with the same version string (enforced in CI by `clients/typescript/scripts/check-versions.ts`).

## Wire format

All adapters emit the same JSON payloads. The contract is authoritative:

- JSON Schema: `schemas/exporter/`
- OpenAPI 3.1: `schemas/openapi.yaml`

Python drift is caught by `tests/test_schemas.py`; TypeScript packages share the same shape via the `EmittableEvent` type in `@agentegrity/client`.
