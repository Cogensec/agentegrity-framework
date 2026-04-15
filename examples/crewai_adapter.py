"""
Zero-config CrewAI instrumentation.

Runs with no API key via mock events.

Requirements:
    pip install "agentegrity[crewai]"

Run:
    python examples/crewai_adapter.py
"""

from __future__ import annotations

import asyncio

from agentegrity.crewai import adapter, report, reset


async def main() -> None:
    # Real integration:
    #
    #     from crewai import Crew, Agent, Task
    #     from agentegrity.crewai import instrument, report
    #     instrument()  # subscribe to the global CrewAI event bus
    #     crew = Crew(agents=[...], tasks=[...])
    #     crew.kickoff(inputs={"topic": "llms"})
    #     print(report())

    reset()
    ad = adapter()
    await ad.on_event("user_prompt_submit", {"prompt": "research llms"})
    await ad.on_event(
        "pre_tool_use", {"tool_name": "serper", "tool_input": {"args": "llm"}}
    )
    await ad.on_event(
        "post_tool_use", {"tool_name": "serper", "tool_response": "ok"}
    )
    await ad.on_event("stop", {})

    summary = report()
    print("Session summary:")
    for key, value in summary.items():
        print(f"  {key}: {value}")


if __name__ == "__main__":
    asyncio.run(main())
