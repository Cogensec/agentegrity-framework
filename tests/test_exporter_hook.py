"""Tests for the SessionExporter extension point on _BaseAdapter.

Uses a direct _BaseAdapter subclass (no framework stubs) so the tests
exercise the exporter plumbing in isolation. A final parametrized test
confirms every zero-config module exposes ``register_exporter``.
"""

from __future__ import annotations

import asyncio
from typing import Any

import pytest

import agentegrity.claude as ag_claude
import agentegrity.crewai as ag_crewai
import agentegrity.google_adk as ag_google_adk
import agentegrity.langchain as ag_langchain
import agentegrity.openai_agents as ag_openai_agents
from agentegrity.adapters.base import SessionExporter, _BaseAdapter
from agentegrity.core.profile import AgentProfile


class _RecordingExporter:
    """In-memory exporter capturing every callback for assertions."""

    def __init__(self) -> None:
        self.starts: list[tuple[str, str, dict[str, Any]]] = []
        self.events: list[tuple[str, dict[str, Any]]] = []
        self.ends: list[tuple[str, dict[str, Any]]] = []

    async def on_session_start(
        self, session_id: str, adapter_name: str, profile: dict[str, Any]
    ) -> None:
        self.starts.append((session_id, adapter_name, profile))

    async def on_event(self, session_id: str, event: dict[str, Any]) -> None:
        self.events.append((session_id, event))

    async def on_session_end(
        self, session_id: str, summary: dict[str, Any]
    ) -> None:
        self.ends.append((session_id, summary))


class _RaisingExporter:
    async def on_session_start(self, *args: Any, **kwargs: Any) -> None:
        raise RuntimeError("boom-start")

    async def on_event(self, *args: Any, **kwargs: Any) -> None:
        raise RuntimeError("boom-event")

    async def on_session_end(self, *args: Any, **kwargs: Any) -> None:
        raise RuntimeError("boom-end")


class _TestAdapter(_BaseAdapter):
    _name = "test"


@pytest.fixture
def adapter() -> _TestAdapter:
    return _TestAdapter(profile=AgentProfile.default())


def test_session_id_is_unique_per_instance() -> None:
    a = _TestAdapter(profile=AgentProfile.default())
    b = _TestAdapter(profile=AgentProfile.default())
    assert a.session_id != b.session_id
    assert len(a.session_id) == 32  # uuid4 hex


def test_register_exporter_is_idempotent(adapter: _TestAdapter) -> None:
    exp = _RecordingExporter()
    adapter.register_exporter(exp)
    adapter.register_exporter(exp)
    assert adapter._exporters == [exp]


def test_exporter_receives_session_start_and_event(adapter: _TestAdapter) -> None:
    exp = _RecordingExporter()
    adapter.register_exporter(exp)

    asyncio.run(
        adapter.on_event(
            "pre_tool_use", {"tool_name": "Read", "tool_input": {"path": "x"}}
        )
    )

    assert len(exp.starts) == 1
    sid, name, profile = exp.starts[0]
    assert sid == adapter.session_id
    assert name == "test"
    assert profile["agent_id"] == adapter.profile.agent_id

    assert len(exp.events) >= 1
    assert all(evt_sid == adapter.session_id for evt_sid, _ in exp.events)
    assert exp.events[0][1]["event_type"] == "pre_tool_use"


def test_close_fires_session_end(adapter: _TestAdapter) -> None:
    exp = _RecordingExporter()
    adapter.register_exporter(exp)

    asyncio.run(
        adapter.on_event("pre_tool_use", {"tool_name": "Read", "tool_input": {}})
    )
    adapter.close()

    assert len(exp.ends) == 1
    sid, summary = exp.ends[0]
    assert sid == adapter.session_id
    assert summary["adapter"] == "test"
    assert summary["events"] >= 1


def test_close_is_idempotent(adapter: _TestAdapter) -> None:
    exp = _RecordingExporter()
    adapter.register_exporter(exp)
    asyncio.run(adapter.on_event("pre_tool_use", {"tool_name": "x", "tool_input": {}}))
    adapter.close()
    adapter.close()
    assert len(exp.ends) == 1


def test_exporter_exceptions_do_not_break_agent(adapter: _TestAdapter) -> None:
    adapter.register_exporter(_RaisingExporter())

    # Must not raise
    asyncio.run(
        adapter.on_event("pre_tool_use", {"tool_name": "Read", "tool_input": {}})
    )
    adapter.close()

    # Agent state is still consistent
    assert len(adapter.events) >= 1
    assert adapter.evaluation_count >= 1


def test_multiple_exporters_each_receive_every_event(
    adapter: _TestAdapter,
) -> None:
    a = _RecordingExporter()
    b = _RecordingExporter()
    adapter.register_exporter(a)
    adapter.register_exporter(b)

    asyncio.run(
        adapter.on_event("pre_tool_use", {"tool_name": "x", "tool_input": {}})
    )
    asyncio.run(adapter.on_event("stop", {"output": "done"}))
    adapter.close()

    assert len(a.events) == len(b.events) >= 2
    assert len(a.ends) == len(b.ends) == 1


def test_no_exporters_does_not_call_to_dict(adapter: _TestAdapter) -> None:
    # Sanity: adapter works normally when no exporters registered
    asyncio.run(
        adapter.on_event("pre_tool_use", {"tool_name": "x", "tool_input": {}})
    )
    adapter.close()
    assert adapter.evaluation_count >= 1


def test_session_exporter_protocol_structural() -> None:
    # _RecordingExporter satisfies SessionExporter structurally
    exp: SessionExporter = _RecordingExporter()
    assert hasattr(exp, "on_session_start")
    assert hasattr(exp, "on_event")
    assert hasattr(exp, "on_session_end")


@pytest.mark.parametrize(
    "module",
    [ag_claude, ag_langchain, ag_openai_agents, ag_crewai, ag_google_adk],
)
def test_zero_config_modules_expose_register_exporter(module: Any) -> None:
    assert hasattr(module, "register_exporter")
    assert "register_exporter" in module.__all__


def teardown_module() -> None:
    for m in (ag_claude, ag_langchain, ag_openai_agents, ag_crewai, ag_google_adk):
        m.reset()
