"""Tests for the agentegrity.openai_agents zero-config surface."""

from __future__ import annotations

import sys
import types
from typing import Any

import pytest

import agentegrity.openai_agents as ao
from agentegrity.core.profile import AgentProfile


@pytest.fixture
def stub_agents(monkeypatch: pytest.MonkeyPatch) -> None:
    mod = types.ModuleType("agents")

    class RunHooks:
        async def on_agent_start(self, context: Any, agent: Any) -> None: ...
        async def on_agent_end(
            self, context: Any, agent: Any, output: Any
        ) -> None: ...
        async def on_tool_start(
            self, context: Any, agent: Any, tool: Any
        ) -> None: ...
        async def on_tool_end(
            self, context: Any, agent: Any, tool: Any, result: Any
        ) -> None: ...
        async def on_handoff(
            self, context: Any, from_agent: Any, to_agent: Any
        ) -> None: ...

    mod.RunHooks = RunHooks  # type: ignore[attr-defined]
    monkeypatch.setitem(sys.modules, "agents", mod)


@pytest.fixture(autouse=True)
def _clean() -> None:
    ao.reset()
    yield
    ao.reset()


def test_report_before_run_hooks_returns_empty() -> None:
    summary = ao.report()
    assert summary["adapter"] == "openai_agents"
    assert summary["evaluations"] == 0


def test_run_hooks_reuses_default(stub_agents: None) -> None:
    ao.run_hooks()
    first = ao.adapter()
    ao.run_hooks()
    assert ao.adapter() is first


def test_run_hooks_with_explicit_profile_isolates_global(stub_agents: None) -> None:
    ao.run_hooks(profile=AgentProfile.default(name="explicit"))
    assert ao._default is None
