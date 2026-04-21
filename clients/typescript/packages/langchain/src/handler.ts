/**
 * AgentegrityLangChainHandler — LangChain JS callback handler that
 * forwards lifecycle events to an agentegrity DefaultAdapter.
 *
 * The handler structurally conforms to LangChain's `BaseCallbackHandler`
 * without importing from `@langchain/core`, so users who do not have
 * `@langchain/core` installed can still build this package (peer dep
 * is declared optional). At runtime LangChain duck-types on method
 * names, so this works as a drop-in callback.
 *
 * Event mapping:
 *   handleChainStart  → user_prompt_submit  (once per top-level chain run)
 *   handleToolStart   → pre_tool_use
 *   handleToolEnd     → post_tool_use
 *   handleToolError   → post_tool_use_failure
 *   handleChainEnd    → stop
 */

import type { DefaultAdapter } from "@agentegrity/client";

interface SerializedLike {
  id?: string[];
  name?: string;
  [k: string]: unknown;
}

export class AgentegrityLangChainHandler {
  readonly name = "agentegrity";
  /**
   * LangChain checks handlers via the `awaitHandlers` flag — true means
   * LangChain awaits our async hooks before continuing, which is what
   * we want (events land in order, exporter errors stay fail-open
   * inside the adapter).
   */
  readonly awaitHandlers = true;

  private readonly adapter: DefaultAdapter;
  private topLevelStarted = false;

  constructor(adapter: DefaultAdapter) {
    this.adapter = adapter;
  }

  /** Public shutdown helper — fires session_end. */
  async close(): Promise<void> {
    await this.adapter.end();
  }

  // ─── LangChain BaseCallbackHandler surface ────────────────────────────────

  async handleChainStart(
    _chain: SerializedLike,
    inputs: Record<string, unknown>,
  ): Promise<void> {
    if (this.topLevelStarted) return;
    this.topLevelStarted = true;
    await this.adapter.emit({
      event_type: "user_prompt_submit",
      data: { inputs },
    });
  }

  async handleChainEnd(outputs: Record<string, unknown>): Promise<void> {
    await this.adapter.emit({
      event_type: "stop",
      data: { outputs },
    });
  }

  async handleChainError(err: unknown): Promise<void> {
    await this.adapter.emit({
      event_type: "stop",
      data: { error: errorMessage(err) },
    });
  }

  async handleToolStart(tool: SerializedLike, input: string): Promise<void> {
    await this.adapter.emit({
      event_type: "pre_tool_use",
      data: { tool_name: toolName(tool), tool_input: input },
    });
  }

  async handleToolEnd(output: string | Record<string, unknown>): Promise<void> {
    await this.adapter.emit({
      event_type: "post_tool_use",
      data: { tool_response: output },
    });
  }

  async handleToolError(err: unknown): Promise<void> {
    await this.adapter.emit({
      event_type: "post_tool_use_failure",
      data: { error: errorMessage(err) },
    });
  }
}

function toolName(tool: SerializedLike | undefined): string {
  if (!tool) return "unknown";
  if (tool.name && typeof tool.name === "string") return tool.name;
  if (Array.isArray(tool.id) && tool.id.length > 0) {
    const last = tool.id[tool.id.length - 1];
    if (typeof last === "string") return last;
  }
  return "unknown";
}

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  try {
    return typeof err === "string" ? err : JSON.stringify(err);
  } catch {
    return String(err);
  }
}
