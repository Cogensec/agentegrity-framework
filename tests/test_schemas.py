"""Validate real Python exporter payloads against the JSON Schemas in
``schemas/exporter/``. Catches drift between the schemas and the
Python dataclass ``to_dict`` outputs at CI time.
"""

from __future__ import annotations

import asyncio
import json
from pathlib import Path
from typing import Any

import pytest

jsonschema = pytest.importorskip("jsonschema")
pytest.importorskip("referencing")
from jsonschema import Draft202012Validator  # noqa: E402
from referencing import Registry, Resource  # noqa: E402

from agentegrity.adapters.base import _BaseAdapter  # noqa: E402
from agentegrity.core.profile import AgentProfile  # noqa: E402

SCHEMAS_DIR = Path(__file__).parent.parent / "schemas" / "exporter"


def _load(name: str) -> dict[str, Any]:
    return json.loads((SCHEMAS_DIR / name).read_text())


@pytest.fixture(scope="module")
def registry() -> Registry:
    """Registry that resolves the relative `common.json` $refs."""
    common = _load("common.json")
    resource = Resource.from_contents(common)
    return Registry().with_resource(uri="common.json", resource=resource)


@pytest.fixture(scope="module")
def session_start_validator(registry: Registry) -> Draft202012Validator:
    return Draft202012Validator(_load("session_start.json"), registry=registry)


@pytest.fixture(scope="module")
def event_validator(registry: Registry) -> Draft202012Validator:
    return Draft202012Validator(_load("event.json"), registry=registry)


@pytest.fixture(scope="module")
def session_end_validator(registry: Registry) -> Draft202012Validator:
    return Draft202012Validator(_load("session_end.json"), registry=registry)


class _TestAdapter(_BaseAdapter):
    _name = "test"


def _drive_adapter() -> _TestAdapter:
    a = _TestAdapter(profile=AgentProfile.default())
    asyncio.run(
        a.on_event(
            "pre_tool_use", {"tool_name": "Read", "tool_input": {"p": "x"}}
        )
    )
    asyncio.run(a.on_event("post_tool_use", {"tool_name": "Read", "tool_response": "ok"}))
    asyncio.run(a.on_event("stop", {"output": "done"}))
    return a


def test_session_start_payload_matches_schema(
    session_start_validator: Draft202012Validator,
) -> None:
    a = _drive_adapter()
    payload = {
        "session_id": a.session_id,
        "adapter_name": a.name,
        "profile": a.profile.to_dict(),
    }
    session_start_validator.validate(payload)


def test_event_payloads_match_schema(
    event_validator: Draft202012Validator,
) -> None:
    a = _drive_adapter()
    assert a.events
    for ev in a.events:
        event_validator.validate(
            {"session_id": a.session_id, "event": ev.to_dict()}
        )


def test_session_end_payload_matches_schema(
    session_end_validator: Draft202012Validator,
) -> None:
    a = _drive_adapter()
    payload = {"session_id": a.session_id, "summary": a.get_summary()}
    session_end_validator.validate(payload)


def test_schemas_are_themselves_valid_draft202012() -> None:
    for name in ("common.json", "session_start.json", "event.json", "session_end.json"):
        schema = _load(name)
        Draft202012Validator.check_schema(schema)


def test_openapi_yaml_parses() -> None:
    yaml = pytest.importorskip("yaml")
    path = SCHEMAS_DIR.parent / "openapi.yaml"
    doc = yaml.safe_load(path.read_text())
    assert doc["openapi"].startswith("3.")
    assert "/sessions" in doc["paths"]
    assert "/sessions/{sessionId}/events" in doc["paths"]
    assert "/sessions/{sessionId}/end" in doc["paths"]
