import { test } from "node:test";
import assert from "node:assert/strict";
import { instrument, report, reset, registerExporter } from "./index.js";
import type { SessionExporter } from "@agentegrity/client";

test("instrument() maps AI SDK spans to agentegrity events", async () => {
  reset();
  const seen: string[] = [];
  const exp: SessionExporter = {
    on_session_start: () => { seen.push("start"); },
    on_event: (_sid, ev) => { seen.push(ev.event_type); },
  };
  registerExporter(exp);

  const { tracer, isEnabled } = instrument();
  assert.equal(isEnabled, true);

  const gen = tracer.startSpan("ai.generateText");
  gen.setAttribute("model", "claude-sonnet-4-5");
  const tool = tracer.startSpan("ai.toolCall");
  tool.end();
  gen.end();

  // allow microtasks to flush
  await new Promise((r) => setTimeout(r, 200));

  assert.ok(seen.includes("start"));
  assert.ok(seen.includes("user_prompt_submit"));
  assert.ok(seen.includes("pre_tool_use"));
  assert.ok(seen.includes("post_tool_use"));
  assert.ok(seen.includes("stop"));
});

test("unknown spans are ignored unless catchAll", async () => {
  reset();
  const seen: string[] = [];
  registerExporter({ on_event: (_sid, ev) => { seen.push(ev.event_type); } });
  const { tracer } = instrument();
  const s = tracer.startSpan("custom.thing");
  s.end();
  await new Promise((r) => setTimeout(r, 10));
  assert.equal(seen.filter((e) => e !== "user_prompt_submit" && e !== "stop" && e !== "pre_tool_use" && e !== "post_tool_use").length, seen.length);
});

test("catchAll emits generic events for unknown spans", async () => {
  reset();
  const seen: string[] = [];
  registerExporter({ on_event: (_sid, ev) => { seen.push(ev.event_type); } });
  const { tracer } = instrument({ catchAll: true });
  const s = tracer.startSpan("custom.thing");
  s.end();
  await new Promise((r) => setTimeout(r, 10));
  assert.ok(seen.includes("user_prompt_submit"));
  assert.ok(seen.includes("stop"));
});

test("recordException emits post_tool_use_failure", async () => {
  reset();
  const seen: string[] = [];
  registerExporter({ on_event: (_sid, ev) => { seen.push(ev.event_type); } });
  const { tracer } = instrument();
  const s = tracer.startSpan("ai.toolCall");
  s.recordException(new Error("boom"));
  s.end();
  await new Promise((r) => setTimeout(r, 10));
  assert.ok(seen.includes("post_tool_use_failure"));
});

test("exporter errors are swallowed", async () => {
  reset();
  registerExporter({ on_event: () => { throw new Error("x"); } });
  const { tracer } = instrument();
  const s = tracer.startSpan("ai.generateText");
  s.end();
  await new Promise((r) => setTimeout(r, 10));
  assert.ok(true);
});

test("report() empty before instrument", async () => {
  reset();
  const s = await report();
  assert.equal(s.adapter, "vercel_ai");
  assert.equal(s.events, 0);
});
