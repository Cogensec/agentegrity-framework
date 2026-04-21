/**
 * `@agentegrity/openai-agents` — zero-config adapter for the OpenAI
 * Agents JS SDK (`@openai/agents`). Mirrors the Python
 * `agentegrity.openai_agents` module 1:1.
 *
 * Usage:
 *
 * ```ts
 * import { Agent, Runner } from "@openai/agents";
 * import { runHooks, report } from "@agentegrity/openai-agents";
 *
 * await Runner.run(agent, "hello", { hooks: runHooks() });
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
    _default = createDefaultAdapter({ adapterName: "openai_agents" });
  }
  return _default;
}

export interface RunHooksOptions {
  profile?: Partial<AgentProfile>;
  enforce?: boolean;
}

/**
 * Build a RunHooks-shaped object for the OpenAI Agents JS runner.
 * The hook names (`onAgentStart`, `onToolStart`, `onToolEnd`,
 * `onAgentFinish`) match the published SDK contract as of 0.0.x.
 */
export function runHooks(options: RunHooksOptions = {}): Record<string, unknown> {
  const ad = options.profile
    ? createDefaultAdapter({ adapterName: "openai_agents", profile: options.profile })
    : defaultAdapter();

  return {
    onAgentStart: async (_ctx: unknown, agentInfo: unknown) => {
      await ad.emit({
        event_type: "user_prompt_submit",
        data: { agent: agentInfo },
      });
    },
    onToolStart: async (_ctx: unknown, _agentInfo: unknown, tool: unknown) => {
      const t = (tool ?? {}) as { name?: string; input?: unknown };
      await ad.emit({
        event_type: "pre_tool_use",
        data: { tool_name: t.name ?? "unknown", tool_input: t.input },
      });
    },
    onToolEnd: async (
      _ctx: unknown,
      _agentInfo: unknown,
      tool: unknown,
      result: unknown,
    ) => {
      const t = (tool ?? {}) as { name?: string };
      await ad.emit({
        event_type: "post_tool_use",
        data: { tool_name: t.name ?? "unknown", tool_response: result },
      });
    },
    onAgentFinish: async (_ctx: unknown, _agentInfo: unknown, output: unknown) => {
      await ad.emit({
        event_type: "stop",
        data: { output },
      });
    },
    onHandoff: async (_ctx: unknown, fromAgent: unknown, toAgent: unknown) => {
      await ad.emit({
        event_type: "subagent_start",
        data: { from: fromAgent, to: toAgent },
      });
    },
  };
}

export async function report(): Promise<SessionSummary> {
  if (_default === null) {
    return {
      adapter: "openai_agents",
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
