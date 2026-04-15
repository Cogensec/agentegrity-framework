"""Tests for the CrewAI adapter."""

from __future__ import annotations

import pytest

from agentegrity.adapters.crewai import CrewAIAdapter
from agentegrity.core.profile import AgentProfile


def test_adapter_name() -> None:
    ad = CrewAIAdapter(profile=AgentProfile.default())
    assert ad.name == "crewai"


@pytest.mark.asyncio
async def test_on_event_user_prompt_and_tool() -> None:
    ad = CrewAIAdapter(profile=AgentProfile.default())
    await ad.on_event("user_prompt_submit", {"prompt": "do research"})
    await ad.on_event(
        "pre_tool_use", {"tool_name": "search", "tool_input": {"args": "llm"}}
    )
    ctx = ad.get_collected_context()
    assert ctx["input"] == "do research"
    assert ctx["tool_usage"]["search"] == 1


def test_subscribe_requires_crewai() -> None:
    ad = CrewAIAdapter(profile=AgentProfile.default())
    with pytest.raises(ImportError, match="crewai"):
        ad.subscribe()
