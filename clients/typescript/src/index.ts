/**
 * `@agentegrity/client` — TypeScript client for the Agentegrity
 * Exporter HTTP API. Emit agent events from a Node / Bun / browser
 * agent to any backend implementing the contract in
 * `schemas/openapi.yaml` (including the commercial `agentegrity-pro`
 * dashboard).
 */

export { AgentegrityReporter } from "./reporter.js";
export type { ReporterOptions } from "./reporter.js";
export type {
  AgentProfile,
  EventPayload,
  EventType,
  FrameworkEvent,
  IntegrityScore,
  LayerResult,
  SessionEndPayload,
  SessionStartPayload,
  SessionSummary,
} from "./types.js";
