import { test } from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { instrument, report, reset, registerExporter } from "./index.js";
import type { SessionExporter } from "@agentegrity/client";

test("bridge.attach() forwards CrewAI events to exporter", async () => {
  reset();
  const seen: string[] = [];
  const exp: SessionExporter = {
    on_session_start: () => { seen.push("start"); },
    on_event: (_sid, ev) => { seen.push(ev.event_type); },
  };
  registerExporter(exp);

  const emitter = new EventEmitter();
  const bridge = instrument();
  bridge.attach(emitter);

  emitter.emit("crew.kickoff", { goal: "go" });
  emitter.emit("tool.start", { tool: "search" });
  emitter.emit("tool.end", { result: "ok" });
  emitter.emit("crew.finish", { output: "done" });
  // give the microtask queue time to drain
  await new Promise((r) => setTimeout(r, 200));

  assert.deepEqual(seen, [
    "start",
    "user_prompt_submit",
    "pre_tool_use",
    "post_tool_use",
    "stop",
  ]);
});

test("bridge.onEvent() accepts unknown events as no-ops", async () => {
  reset();
  const seen: string[] = [];
  registerExporter({ on_event: (_sid, ev) => seen.push(ev.event_type) });
  const bridge = instrument();
  await bridge.onEvent("unknown.event", {});
  await bridge.onEvent("crew.kickoff", {});
  assert.deepEqual(seen, ["user_prompt_submit"]);
});

test("attach is idempotent", () => {
  reset();
  const bridge = instrument();
  const em = new EventEmitter();
  bridge.attach(em);
  bridge.attach(em);
  // Listener count should match 1 attachment, not 2
  assert.equal(em.listenerCount("crew.kickoff"), 1);
});

test("exporter errors are swallowed", async () => {
  reset();
  registerExporter({ on_event: () => { throw new Error("boom"); } });
  const bridge = instrument();
  await bridge.onEvent("crew.kickoff", {});
  assert.ok(true);
});

test("report() before instrument() returns empty", async () => {
  reset();
  const s = await report();
  assert.equal(s.adapter, "crewai");
  assert.equal(s.events, 0);
});
