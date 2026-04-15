"""Tests for the agentegrity.google_adk zero-config surface."""

from __future__ import annotations

from typing import Any

import pytest

import agentegrity.google_adk as ag
from agentegrity.core.profile import AgentProfile


class _FakeAgent:
    before_agent_callback: Any = None
    after_agent_callback: Any = None
    before_tool_callback: Any = None
    after_tool_callback: Any = None


@pytest.fixture(autouse=True)
def _clean() -> None:
    ag.reset()
    yield
    ag.reset()


def test_report_before_instrument_returns_empty() -> None:
    summary = ag.report()
    assert summary["adapter"] == "google_adk"
    assert summary["evaluations"] == 0


def test_instrument_lazy_default() -> None:
    a = _FakeAgent()
    ag.instrument(a)
    assert a.before_agent_callback is not None
    first = ag.adapter()
    second = ag.adapter()
    assert first is second


def test_instrument_explicit_profile_isolates_global() -> None:
    a = _FakeAgent()
    ag.instrument(a, profile=AgentProfile.default(name="explicit"))
    assert ag._default is None
