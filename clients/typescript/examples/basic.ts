/**
 * Minimal example: a TypeScript / Bun agent reports tool-use events
 * to an Agentegrity Exporter HTTP backend (e.g. the commercial
 * agentegrity-pro dashboard running at http://localhost:8787).
 *
 * Run (Bun):
 *   bun run clients/typescript/examples/basic.ts
 *
 * Run (Node 18+):
 *   npx tsx clients/typescript/examples/basic.ts
 */

import { AgentegrityReporter } from "../src/index.js";

async function main(): Promise<void> {
  const reporter = new AgentegrityReporter({
    baseUrl: process.env.AGENTEGRITY_URL ?? "http://localhost:8787",
    adapterName: "bun-demo",
    profile: {
      agent_id: "demo-agent",
      name: "demo",
      agent_type: "tool_using",
      capabilities: ["tool_use"],
      deployment_context: "cloud",
      risk_tier: "medium",
    },
  });

  await reporter.start();

  await reporter.emit({
    event_type: "user_prompt_submit",
    data: { prompt: "Summarize the latest LLM safety papers" },
  });

  await reporter.emit({
    event_type: "pre_tool_use",
    data: { tool_name: "search", tool_input: { query: "LLM safety 2026" } },
  });

  await reporter.emit({
    event_type: "post_tool_use",
    data: { tool_name: "search", tool_response: "3 results" },
  });

  await reporter.emit({ event_type: "stop", data: { output: "done" } });

  await reporter.end({ evaluations: 3, events: 4 });

  console.log(`session ${reporter.sessionId} reported`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
