"""
Zero-config Google ADK instrumentation.

Runs with no API key via mock events.

Requirements:
    pip install "agentegrity[google-adk]"

Run:
    python examples/google_adk_adapter.py
"""

from __future__ import annotations

import asyncio

from agentegrity.google_adk import adapter, report, reset


async def main() -> None:
    # Real integration:
    #
    #     from google.adk.agents import LlmAgent
    #     from google.adk.runners import Runner
    #     from agentegrity.google_adk import instrument, report
    #     agent = LlmAgent(name="researcher", ...)
    #     instrument(agent)
    #     await Runner(agent=agent).run_async(user_content="Research LLMs")
    #     print(report())

    reset()
    ad = adapter()
    await ad.on_event("user_prompt_submit", {"prompt": "Research LLMs"})
    await ad.on_event(
        "pre_tool_use", {"tool_name": "google_search", "tool_input": {"q": "llm"}}
    )
    await ad.on_event(
        "post_tool_use", {"tool_name": "google_search", "tool_response": "ok"}
    )
    await ad.on_event("stop", {})

    summary = report()
    print("Session summary:")
    for key, value in summary.items():
        print(f"  {key}: {value}")


if __name__ == "__main__":
    asyncio.run(main())
