"""
Zero-config OpenAI Agents SDK instrumentation.

Runs with no API key via mock events.

Requirements:
    pip install "agentegrity[openai-agents]"

Run:
    python examples/openai_agents_adapter.py
"""

from __future__ import annotations

import asyncio

from agentegrity.openai_agents import adapter, report, reset


async def main() -> None:
    # Real integration:
    #
    #     from agents import Agent, Runner
    #     from agentegrity.openai_agents import run_hooks, report
    #     agent = Agent(name="researcher", instructions="...")
    #     await Runner.run(agent, input="Research LLMs", hooks=run_hooks())
    #     print(report())

    reset()
    ad = adapter()
    await ad.on_event("user_prompt_submit", {"prompt": "Research LLMs"})
    await ad.on_event(
        "pre_tool_use", {"tool_name": "web_search", "tool_input": {"q": "llm"}}
    )
    await ad.on_event(
        "post_tool_use", {"tool_name": "web_search", "tool_response": "ok"}
    )
    await ad.on_event("stop", {})

    summary = report()
    print("Session summary:")
    for key, value in summary.items():
        print(f"  {key}: {value}")


if __name__ == "__main__":
    asyncio.run(main())
