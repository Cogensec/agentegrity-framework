import { test } from "node:test";
import assert from "node:assert/strict";
import { instrument, report, reset, registerExporter } from "./index.js";
import type { SessionExporter } from "@agentegrity/client";

function fakeAgent() {
  const listeners: Record<string, Array<(...args: unknown[]) => unknown>> = {};
  return {
    addBeforeAgentCallback(fn: (...args: unknown[]) => unknown) {
      (listeners["beforeAgent"] ??= []).push(fn);
    },
    addAfterAgentCallback(fn: (...args: unknown[]) => unknown) {
      (listeners["afterAgent"] ??= []).push(fn);
    },
    addBeforeToolCallback(fn: (...args: unknown[]) => unknown) {
      (listeners["beforeTool"] ??= []).push(fn);
    },
    addAfterToolCallback(fn: (...args: unknown[]) => unknown) {
      (listeners["afterTool"] ??= []).push(fn);
    },
    async fire(event: string, ...args: unknown[]) {
      for (const fn of listeners[event] ?? []) {
        await fn(...args);
      }
    },
  };
}

test("instrument() wires callback hooks", async () => {
  reset();
  const seen: string[] = [];
  const exp: SessionExporter = {
    on_session_start: () => { seen.push("start"); },
    on_event: (_sid, ev) => { seen.push(ev.event_type); },
  };
  registerExporter(exp);

  const agent = fakeAgent();
  const close = instrument(agent);

  await agent.fire("beforeAgent", { input: "hi" });
  await agent.fire("beforeTool", { name: "search" }, { q: "x" });
  await agent.fire("afterTool", { name: "search" }, { hits: 1 });
  await agent.fire("afterAgent", { output: "done" });
  await close();

  assert.deepEqual(seen.slice(0, 5), [
    "start",
    "user_prompt_submit",
    "pre_tool_use",
    "post_tool_use",
    "stop",
  ]);
});

test("instrument() is idempotent on the same agent", () => {
  reset();
  const agent = fakeAgent();
  const spy = { count: 0 };
  const originalAdd = agent.addBeforeAgentCallback;
  agent.addBeforeAgentCallback = (fn) => {
    spy.count++;
    originalAdd.call(agent, fn);
  };
  instrument(agent);
  instrument(agent);
  assert.equal(spy.count, 1);
});

test("exporter errors are swallowed", async () => {
  reset();
  registerExporter({ on_event: () => { throw new Error("boom"); } });
  const agent = fakeAgent();
  instrument(agent);
  await agent.fire("beforeAgent", {});
  assert.ok(true);
});

test("report() empty before instrument", async () => {
  reset();
  const s = await report();
  assert.equal(s.adapter, "google_adk");
  assert.equal(s.events, 0);
});
