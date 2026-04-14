# Agentegrity Quickstart

Three copy-paste blocks. Pick the one that matches your setup and run it.

## 1. Instrument an existing Claude Agent SDK agent

```bash
pip install "agentegrity[claude]"
```

```python
from claude_agent_sdk import ClaudeSDKClient, ClaudeAgentOptions
from agentegrity.claude import hooks, report

async with ClaudeSDKClient(options=ClaudeAgentOptions(hooks=hooks())) as sdk:
    await sdk.query("Summarize the latest LLM safety papers")
print(report())
```

`hooks()` lazily builds a default adapter with a generic `AgentProfile`, the full four-layer evaluator (adversarial, cortical, governance, recovery), and measure-only semantics. It never blocks tool calls unless you pass `enforce=True`. `report()` returns a session summary — evaluation count, attestation chain length, whether the chain verifies.

## 2. Score an arbitrary agent profile

```bash
pip install agentegrity
```

```python
from agentegrity import AgentegrityClient

client = AgentegrityClient()
score = client.evaluate(client.create_profile(name="my-agent"))
print(f"{score.composite:.3f}  ({score.action})")
```

Use this for one-off profile scoring, CI gates, or agents outside the Claude SDK.

## 3. Confidence test from the terminal

```bash
python -m agentegrity          # version + adapter availability
python -m agentegrity doctor   # end-to-end self-check, prints composite score
```

If `doctor` prints a composite score and `OK`, your install is wired correctly.

---

## Next steps

- **Custom thresholds, layer weights, and threat detectors** — drop down to `IntegrityEvaluator` and the individual layers (see the "Configuring the evaluator" section in the [README](../README.md)).
- **Cryptographic attestation signing** — `pip install "agentegrity[crypto]"` and call `AttestationRecord.sign(private_key)` to produce verifiable records.
- **LLM-backed cortical checks** — `pip install "agentegrity[llm]"` and pass `LLMCorticalCheck` instances to `CorticalLayer(llm_checks=[...])` for semantic reasoning-chain validation.
- **Governance policies** — customize `GovernanceLayer(policy_set=...)` or register custom policy rules. See [`spec/layers/governance-layer.md`](../spec/layers/governance-layer.md).
- **Full specification** — [`spec/SPECIFICATION.md`](../spec/SPECIFICATION.md) is the source of truth for the property definitions, layer contracts, and scoring methodology.
