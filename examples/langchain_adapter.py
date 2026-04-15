"""
Zero-config LangChain / LangGraph instrumentation.

Runs with no API key — dispatches mock events directly so it works in CI.

Requirements:
    pip install "agentegrity[langchain]"

Run:
    python examples/langchain_adapter.py

For real LangChain or LangGraph integration, uncomment the blocks below.
"""

from __future__ import annotations

import asyncio

from agentegrity.langchain import adapter, report, reset


async def main() -> None:
    # Real LangChain integration:
    #
    #     from langchain.agents import AgentExecutor, create_tool_calling_agent
    #     from agentegrity.langchain import instrument_chain, report
    #     agent_exec = create_tool_calling_agent(llm, tools, prompt)
    #     chain = instrument_chain(AgentExecutor(agent=agent_exec, tools=tools))
    #     chain.invoke({"input": "Research the latest LLM benchmarks"})
    #     print(report())
    #
    # Real LangGraph integration:
    #
    #     from langgraph.graph import StateGraph
    #     from agentegrity.langchain import instrument_graph, report
    #     graph = instrument_graph(StateGraph(...).compile())
    #     graph.invoke({"input": "..."})
    #     print(report())

    reset()
    ad = adapter()
    await ad.on_event("user_prompt_submit", {"prompt": "Research LLM benchmarks"})
    await ad.on_event(
        "pre_tool_use",
        {"tool_name": "search", "tool_input": {"q": "llm benchmarks 2026"}},
    )
    await ad.on_event(
        "post_tool_use",
        {"tool_name": "search", "tool_response": "Found 10 results..."},
    )
    await ad.on_event("stop", {})

    summary = report()
    print("Session summary:")
    for key, value in summary.items():
        print(f"  {key}: {value}")


if __name__ == "__main__":
    asyncio.run(main())
