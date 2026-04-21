import { test } from "node:test";
import assert from "node:assert/strict";
import { runHooks, report, reset, registerExporter } from "./index.js";
import type { SessionExporter } from "@agentegrity/client";

test("runHooks() returns all five lifecycle callbacks", () => {
  reset();
  const h = runHooks();
  assert.equal(typeof h.onAgentStart, "function");
  assert.equal(typeof h.onToolStart, "function");
  assert.equal(typeof h.onToolEnd, "function");
  assert.equal(typeof h.onAgentFinish, "function");
  assert.equal(typeof h.onHandoff, "function");
});

test("lifecycle events forward to exporter in order", async () => {
  reset();
  const seen: string[] = [];
  const exp: SessionExporter = {
    on_session_start: () => { seen.push("start"); },
    on_event: (_sid, ev) => { seen.push(ev.event_type); },
  };
  registerExporter(exp);
  const h = runHooks() as Record<string, (...args: unknown[]) => Promise<void>>;
  await h.onAgentStart!({}, { name: "main" });
  await h.onToolStart!({}, {}, { name: "lookup", input: { q: "x" } });
  await h.onToolEnd!({}, {}, { name: "lookup" }, { hit: true });
  await h.onHandoff!({}, { name: "main" }, { name: "sub" });
  await h.onAgentFinish!({}, {}, { final: "done" });
  assert.deepEqual(seen, [
    "start",
    "user_prompt_submit",
    "pre_tool_use",
    "post_tool_use",
    "subagent_start",
    "stop",
  ]);
});

test("exporter errors are swallowed", async () => {
  reset();
  registerExporter({ on_event: () => { throw new Error("boom"); } });
  const h = runHooks() as Record<string, (...args: unknown[]) => Promise<void>>;
  await h.onAgentStart!({}, { name: "x" });
  assert.ok(true);
});

test("report() before runHooks() returns empty summary", async () => {
  reset();
  const s = await report();
  assert.equal(s.adapter, "openai_agents");
  assert.equal(s.events, 0);
});
