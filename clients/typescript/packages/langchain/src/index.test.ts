import { test } from "node:test";
import assert from "node:assert/strict";
import { instrument, report, reset, registerExporter } from "./index.js";
import type { SessionExporter } from "@agentegrity/client";

test("instrument() returns a handler with LangChain-shaped methods", () => {
  reset();
  const h = instrument() as unknown as Record<string, unknown>;
  assert.equal(typeof h.handleChainStart, "function");
  assert.equal(typeof h.handleChainEnd, "function");
  assert.equal(typeof h.handleToolStart, "function");
  assert.equal(typeof h.handleToolEnd, "function");
  assert.equal(typeof h.handleToolError, "function");
  assert.equal(h.awaitHandlers, true);
});

test("handler forwards chain + tool events to registered exporter", async () => {
  reset();
  const seen: string[] = [];
  const exporter: SessionExporter = {
    on_session_start: () => {
      seen.push("start");
    },
    on_event: (_sid, ev) => {
      seen.push(ev.event_type);
    },
  };
  registerExporter(exporter);

  const h = instrument();
  await h.handleChainStart({ id: ["MyChain"] }, { input: "hello" });
  await h.handleToolStart({ id: ["Tool", "readFile"] }, "/tmp/x");
  await h.handleToolEnd("ok");
  await h.handleChainEnd({ output: "done" });

  assert.deepEqual(seen, [
    "start",
    "user_prompt_submit",
    "pre_tool_use",
    "post_tool_use",
    "stop",
  ]);
});

test("tool name falls back through id → name → 'unknown'", async () => {
  reset();
  const events: Record<string, unknown>[] = [];
  registerExporter({
    on_event: (_sid, ev) => {
      events.push(ev.data);
    },
  });
  const h = instrument();
  await h.handleToolStart({ id: ["NS", "readFile"] }, "i1");
  await h.handleToolStart({ name: "writeFile" }, "i2");
  await h.handleToolStart({}, "i3");
  assert.equal((events[0] as { tool_name: string }).tool_name, "readFile");
  assert.equal((events[1] as { tool_name: string }).tool_name, "writeFile");
  assert.equal((events[2] as { tool_name: string }).tool_name, "unknown");
});

test("exporter errors do not propagate to LangChain", async () => {
  reset();
  registerExporter({
    on_event: () => {
      throw new Error("boom");
    },
  });
  const h = instrument();
  await h.handleChainStart({ id: ["X"] }, {});
  assert.ok(true, "no throw");
});

test("report() before instrument() returns empty well-formed summary", async () => {
  reset();
  const s = await report();
  assert.equal(s.adapter, "langchain");
  assert.equal(s.events, 0);
});
