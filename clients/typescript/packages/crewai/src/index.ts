/**
 * `@agentegrity/crewai` — zero-config adapter for CrewAI JS.
 *
 * CrewAI JS is currently pre-1.0 — its callback / event-emitter
 * contract is subject to change. This package ships a small event
 * bridge that accepts any of the patterns CrewAI JS has used so far:
 *
 *   - A Node EventEmitter exposed as `crew.events` (most common).
 *   - A callback list passed to `crew.kickoff({ callbacks: [...] })`.
 *   - Manual event emission via `instrument().on(name, payload)`.
 *
 * Users call `instrument()` once, receive a bridge object, and either
 * attach it to their crew's event emitter or pass it as a callback.
 * The bridge is idempotent — attaching it twice is a no-op.
 *
 * Python parity: mirrors `agentegrity.crewai` surface
 * (`instrument()`, `report()`, `reset()`, `registerExporter()`).
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
    _default = createDefaultAdapter({ adapterName: "crewai" });
  }
  return _default;
}

export interface InstrumentOptions {
  profile?: Partial<AgentProfile>;
  enforce?: boolean;
}

export interface CrewAIEventBridge {
  /** Attach to a CrewAI-shaped EventEmitter (has `.on(name, listener)`). */
  attach(emitter: { on: (event: string, listener: (...args: unknown[]) => void) => unknown }): void;
  /** Manually forward a single CrewAI event. Useful when using callbacks. */
  onEvent(eventName: string, payload?: Record<string, unknown>): Promise<void>;
  /** Close the session — call from the crew's shutdown path. */
  close(): Promise<void>;
  /** The full set of CrewAI-shaped handler callbacks (for `callbacks: [...]` arrays). */
  handlers: Record<string, (payload?: Record<string, unknown>) => Promise<void>>;
}

const CREWAI_EVENT_MAP: Record<string, Parameters<DefaultAdapter["emit"]>[0]["event_type"]> = {
  "crew.kickoff": "user_prompt_submit",
  "crew.start": "user_prompt_submit",
  "agent.start": "user_prompt_submit",
  "tool.start": "pre_tool_use",
  "tool.end": "post_tool_use",
  "tool.error": "post_tool_use_failure",
  "crew.finish": "stop",
  "crew.end": "stop",
  "agent.finish": "stop",
};

export function instrument(options: InstrumentOptions = {}): CrewAIEventBridge {
  const ad = options.profile
    ? createDefaultAdapter({ adapterName: "crewai", profile: options.profile })
    : defaultAdapter();

  const attached = new WeakSet<object>();
  // Serialize fire-and-forget emitter listeners so events reach the
  // exporter in the order they were emitted.
  let queue: Promise<void> = Promise.resolve();

  const onEvent = async (
    eventName: string,
    payload: Record<string, unknown> = {},
  ): Promise<void> => {
    const mapped = CREWAI_EVENT_MAP[eventName];
    if (!mapped) return; // unknown events are silently ignored
    await ad.emit({ event_type: mapped, data: { source_event: eventName, ...payload } });
  };

  const handlers: CrewAIEventBridge["handlers"] = {};
  for (const [name, _eventType] of Object.entries(CREWAI_EVENT_MAP)) {
    handlers[name] = (payload) => onEvent(name, payload);
  }

  return {
    attach(emitter) {
      if (attached.has(emitter)) return;
      attached.add(emitter);
      for (const name of Object.keys(CREWAI_EVENT_MAP)) {
        emitter.on(name, (payload: unknown) => {
          queue = queue.then(() =>
            onEvent(name, (payload ?? {}) as Record<string, unknown>),
          );
        });
      }
    },
    onEvent,
    async close() {
      await ad.end();
    },
    handlers,
  };
}

export async function report(): Promise<SessionSummary> {
  if (_default === null) {
    return {
      adapter: "crewai",
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
