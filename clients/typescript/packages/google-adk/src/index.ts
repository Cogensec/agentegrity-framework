/**
 * `@agentegrity/google-adk` — zero-config adapter for the Google Agent
 * Development Kit (ADK) JS. Mirrors the Python
 * `agentegrity.google_adk` module 1:1.
 *
 * Google ADK JS exposes a plugin / callback registration API on
 * `Agent` and `Runner`. This package provides a single `instrument(agent)`
 * function that wires agentegrity callbacks into the agent's lifecycle
 * without coupling to a specific ADK version.
 *
 * Usage:
 *
 * ```ts
 * import { Agent, Runner } from "@google/adk";
 * import { instrument, report } from "@agentegrity/google-adk";
 *
 * const agent = new Agent({ name: "my-agent" });
 * instrument(agent);
 * const runner = new Runner(agent);
 * await runner.run({ input: "hello" });
 * console.log(await report());
 * ```
 */

import {
  createDefaultAdapter,
  type AgentProfile,
  type DefaultAdapter,
  type SessionExporter,
  type SessionSummary,
} from "@agentegrity/client";

let _default: DefaultAdapter | null = null;

function defaultAdapter(): DefaultAdapter {
  if (_default === null) {
    _default = createDefaultAdapter({ adapterName: "google_adk" });
  }
  return _default;
}

export interface InstrumentOptions {
  profile?: Partial<AgentProfile>;
  enforce?: boolean;
}

/**
 * Any object that exposes a subset of the Google ADK Agent hook-
 * registration methods. Methods we call are duck-typed so this adapter
 * works across ADK JS 0.x versions without importing the SDK.
 */
export interface AdkAgentLike {
  addBeforeAgentCallback?(fn: (...args: unknown[]) => unknown): void;
  addAfterAgentCallback?(fn: (...args: unknown[]) => unknown): void;
  addBeforeToolCallback?(fn: (...args: unknown[]) => unknown): void;
  addAfterToolCallback?(fn: (...args: unknown[]) => unknown): void;
  addPlugin?(plugin: Record<string, unknown>): void;
  on?(event: string, listener: (...args: unknown[]) => void): unknown;
  [k: string]: unknown;
}

/**
 * Wire agentegrity callbacks into a Google ADK Agent. Safe to call
 * multiple times — subsequent calls on the same agent are no-ops.
 *
 * Returns a cleanup function that fires `session_end` when called.
 */
export function instrument(
  agent: AdkAgentLike,
  options: InstrumentOptions = {},
): () => Promise<void> {
  const ad = options.profile
    ? createDefaultAdapter({ adapterName: "google_adk", profile: options.profile })
    : defaultAdapter();

  if ((agent as { __agentegrityAttached?: boolean }).__agentegrityAttached) {
    return async () => {
      await ad.end();
    };
  }
  (agent as { __agentegrityAttached?: boolean }).__agentegrityAttached = true;

  const beforeAgent = async (ctx: unknown) => {
    await ad.emit({ event_type: "user_prompt_submit", data: { context: ctx } });
  };
  const afterAgent = async (ctx: unknown) => {
    await ad.emit({ event_type: "stop", data: { context: ctx } });
  };
  const beforeTool = async (tool: unknown, args: unknown) => {
    const t = (tool ?? {}) as { name?: string };
    await ad.emit({
      event_type: "pre_tool_use",
      data: { tool_name: t.name ?? "unknown", tool_input: args },
    });
  };
  const afterTool = async (tool: unknown, result: unknown) => {
    const t = (tool ?? {}) as { name?: string };
    await ad.emit({
      event_type: "post_tool_use",
      data: { tool_name: t.name ?? "unknown", tool_response: result },
    });
  };

  // Try the primary callback-registration API.
  if (typeof agent.addBeforeAgentCallback === "function") {
    agent.addBeforeAgentCallback(beforeAgent);
  }
  if (typeof agent.addAfterAgentCallback === "function") {
    agent.addAfterAgentCallback(afterAgent);
  }
  if (typeof agent.addBeforeToolCallback === "function") {
    agent.addBeforeToolCallback(beforeTool);
  }
  if (typeof agent.addAfterToolCallback === "function") {
    agent.addAfterToolCallback(afterTool);
  }

  // Fallback — EventEmitter-style API.
  if (typeof agent.on === "function") {
    agent.on("agent:start", beforeAgent);
    agent.on("agent:end", afterAgent);
    agent.on("tool:start", (tool: unknown, args: unknown) => void beforeTool(tool, args));
    agent.on("tool:end", (tool: unknown, result: unknown) => void afterTool(tool, result));
  }

  // Fallback — plugin-registration API.
  if (typeof agent.addPlugin === "function") {
    agent.addPlugin({
      name: "agentegrity",
      beforeAgent,
      afterAgent,
      beforeTool,
      afterTool,
    });
  }

  return async () => {
    await ad.end();
  };
}

export async function report(): Promise<SessionSummary> {
  if (_default === null) {
    return {
      adapter: "google_adk",
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

export type { SessionExporter };
