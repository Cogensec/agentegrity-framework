/**
 * `@agentegrity/langchain` — zero-config adapter for LangChain JS and
 * LangGraph JS. Mirrors the Python `agentegrity.langchain` module 1:1.
 *
 * Usage:
 *
 * ```ts
 * import { ChatAnthropic } from "@langchain/anthropic";
 * import { instrument, report } from "@agentegrity/langchain";
 *
 * const llm = new ChatAnthropic({ callbacks: [instrument()] });
 * // ... run chain / graph ...
 * console.log(await report());
 * ```
 *
 * LangChain's callback system propagates down into every tool, chain,
 * sub-chain, and LLM call — so wiring it once at the top is enough.
 */

import {
  createDefaultAdapter,
  type AgentProfile,
  type DefaultAdapter,
  type SessionExporter,
  type SessionSummary,
} from "@agentegrity/client";

import { AgentegrityLangChainHandler } from "./handler.js";

let _default: DefaultAdapter | null = null;

function defaultAdapter(): DefaultAdapter {
  if (_default === null) {
    _default = createDefaultAdapter({ adapterName: "langchain" });
  }
  return _default;
}

export interface InstrumentOptions {
  profile?: Partial<AgentProfile>;
  /** Reserved for future enforce semantics. Accepted but ignored in v0.5.0. */
  enforce?: boolean;
}

/**
 * Build a LangChain callback handler wired to the default agentegrity
 * adapter. Pass it via `callbacks: [instrument()]` when constructing
 * your model, chain, or graph — LangChain propagates callbacks to
 * every child runnable automatically.
 */
export function instrument(options: InstrumentOptions = {}): AgentegrityLangChainHandler {
  const ad = options.profile
    ? createDefaultAdapter({ adapterName: "langchain", profile: options.profile })
    : defaultAdapter();
  return new AgentegrityLangChainHandler(ad);
}

export async function report(): Promise<SessionSummary> {
  if (_default === null) {
    return {
      adapter: "langchain",
      agent_id: null,
      evaluations: 0,
      events: 0,
      attestation_records: 0,
      chain_valid: true,
      enforce_mode: false,
    };
  }
  return _default.getSummary();
}

export function reset(): void {
  _default = null;
}

export function registerExporter(exporter: SessionExporter): void {
  defaultAdapter().registerExporter(exporter);
}

export function adapter(): DefaultAdapter {
  return defaultAdapter();
}

export { AgentegrityLangChainHandler };
export type { SessionExporter };
