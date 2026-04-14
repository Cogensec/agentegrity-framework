"""
Zero-config Claude Agent SDK instrumentation.

The fastest way to add agentegrity to an existing Claude Agent SDK
agent. This example runs with no API key (it dispatches mock hook
events directly) so it works inside CI.

Requirements:
    pip install "agentegrity[claude]"

Run:
    python examples/claude_adapter.py

For explicit-config usage (custom profile, custom evaluator,
enforcement mode), see examples/claude_adapter_advanced.py.
"""

from __future__ import annotations

import asyncio

from agentegrity.claude import adapter, report, reset


async def main() -> None:
    # Real integration is two lines — uncomment when you have a
    # Claude SDK agent running with ANTHROPIC_API_KEY:
    #
    #     from claude_agent_sdk import ClaudeSDKClient, ClaudeAgentOptions
    #     from agentegrity.claude import hooks
    #     async with ClaudeSDKClient(
    #         options=ClaudeAgentOptions(hooks=hooks())
    #     ) as sdk:
    #         await sdk.query("Research the latest LLM benchmarks")
    #         async for message in sdk.receive_response():
    #             print(message)
    #     print(report())

    reset()  # start with a clean session for this standalone demo
    ad = adapter()  # lazily construct the default adapter
    await ad.on_event("user_prompt_submit", {"prompt": "Research LLM benchmarks"})
    await ad.on_event(
        "pre_tool_use",
        {"tool_name": "WebSearch", "tool_input": {"query": "LLM benchmarks 2026"}},
    )
    await ad.on_event(
        "post_tool_use",
        {"tool_name": "WebSearch", "tool_response": "Found 10 results..."},
    )
    await ad.on_event("stop", {})

    summary = report()
    print("Session summary:")
    for key, value in summary.items():
        print(f"  {key}: {value}")


if __name__ == "__main__":
    asyncio.run(main())
