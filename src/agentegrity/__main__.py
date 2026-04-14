"""
Minimal CLI: ``python -m agentegrity``.

Prints version + adapter availability. Running ``python -m agentegrity
doctor`` exercises the default client end-to-end against
:meth:`AgentProfile.default` and prints the resulting composite
integrity score. This is a smoke test that takes zero reading —
if it prints a number, the install is wired correctly.
"""

from __future__ import annotations

import importlib.util
import sys

from agentegrity import __version__
from agentegrity.core.profile import AgentProfile
from agentegrity.sdk.client import AgentegrityClient


def _claude_available() -> bool:
    return importlib.util.find_spec("claude_agent_sdk") is not None


def _llm_available() -> bool:
    return importlib.util.find_spec("anthropic") is not None


def _info() -> int:
    print(f"agentegrity {__version__}")
    print()
    print("Adapters:")
    claude_status = "installed" if _claude_available() else "not installed"
    print(f'  claude   [{claude_status}]  — pip install "agentegrity[claude]"')
    print()
    print("Layers shipped: adversarial, cortical, governance, recovery")
    print()
    llm_status = "installed" if _llm_available() else "not installed"
    print(f'Optional LLM cortical checks: [{llm_status}]  — pip install "agentegrity[llm]"')
    return 0


def _doctor() -> int:
    print(f"agentegrity {__version__} — self-check")
    client = AgentegrityClient()
    profile = AgentProfile.default(name="doctor-agent")
    score = client.evaluate(profile)
    print(f"  profile:   {profile!r}")
    print(f"  composite: {score.composite:.3f}")
    print(f"  action:    {score.action}")
    print(f"  layers:    {', '.join(r.layer_name for r in score.layer_results)}")
    print("OK" if score.composite > 0 else "FAIL")
    return 0 if score.composite > 0 else 1


def main(argv: list[str] | None = None) -> int:
    args = argv if argv is not None else sys.argv[1:]
    if not args:
        return _info()
    if args[0] == "doctor":
        return _doctor()
    if args[0] in ("-h", "--help", "help"):
        print("usage: python -m agentegrity [doctor]")
        print()
        print("  (no args)  print version + adapter availability")
        print("  doctor     run an end-to-end self-check")
        return 0
    print(f"unknown command: {args[0]!r} (try 'python -m agentegrity help')", file=sys.stderr)
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
