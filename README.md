# Agentegrity Framework

**The open standard for AI agent integrity.**

Agentegrity (agent + integrity) is a security framework that defines what it means for an autonomous AI agent to be *whole* — adversarially coherent, environmentally portable, and verifiably assured. It provides a specification, a three-layer architecture, and a Python reference implementation for building, evaluating, and enforcing agent integrity at runtime.

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![Framework Version](https://img.shields.io/badge/spec-v1.0.0-green.svg)](spec/SPECIFICATION.md)

---

## Why Agentegrity

Existing AI security approaches bolt protection *onto* agents after deployment. Guardrails filter inputs. Monitoring watches outputs. But neither addresses the fundamental question: **is the agent itself intact?**

An agent can pass every guardrail check and still be compromised — its reasoning manipulated, its memory poisoned, its behavior drifted from specification. Agentegrity defines and enforces integrity from the inside out.

### The Three Properties

Every agent claiming agentegrity must satisfy three properties simultaneously:

| Property | Definition | What It Prevents |
|---|---|---|
| **Adversarial Coherence** | The agent maintains consistent reasoning and behavior under active adversarial pressure | Goal hijacking, prompt injection, reasoning manipulation |
| **Environmental Portability** | The agent's integrity guarantees hold across deployment contexts — cloud, edge, multi-agent, physical | Environment-specific exploits, trust boundary violations |
| **Verifiable Assurance** | The agent's integrity state is cryptographically provable, not just observable | Undetected compromise, audit gaps, trust assumptions |

### The Three Layers

The framework implements integrity through three architectural layers:

```
┌─────────────────────────────────────────────┐
│           GOVERNANCE LAYER                  │
│   Policy enforcement · Human oversight ·    │
│   Compliance mapping · Audit trails         │
├─────────────────────────────────────────────┤
│            CORTICAL LAYER                   │
│   Reasoning integrity · Memory provenance · │
│   Behavioral baselines · Drift detection    │
├─────────────────────────────────────────────┤
│           ADVERSARIAL LAYER                 │
│   Attack surface analysis · Threat          │
│   detection · Red team validation ·         │
│   Coherence scoring                         │
└─────────────────────────────────────────────┘
```

---

## Quick Start

### Installation

```bash
pip install agentegrity
```

### Basic Usage

```python
from agentegrity import AgentProfile, IntegrityEvaluator
from agentegrity.layers import AdversarialLayer, CorticalLayer, GovernanceLayer

# Define an agent profile
profile = AgentProfile(
    agent_id="agent-001",
    capabilities=["tool_use", "memory_access", "multi_agent_comm"],
    deployment_context="cloud",
    risk_tier="high"
)

# Initialize the evaluator with all three layers
evaluator = IntegrityEvaluator(
    layers=[
        AdversarialLayer(coherence_threshold=0.85),
        CorticalLayer(drift_tolerance=0.10),
        GovernanceLayer(policy_set="enterprise-default")
    ]
)

# Evaluate agent integrity
result = evaluator.evaluate(profile)
print(result.score)          # 0.0 - 1.0 composite integrity score
print(result.properties)     # Per-property breakdown
print(result.attestation)    # Cryptographic attestation record
```

### Runtime Monitoring

```python
from agentegrity import IntegrityMonitor

monitor = IntegrityMonitor(profile, evaluator)

# Wrap agent execution with integrity monitoring
@monitor.guard
async def agent_action(context):
    # Your agent logic here
    result = await agent.execute(context)
    return result

# The monitor validates integrity before, during, and after execution
# Violations trigger configurable responses: log, alert, block, escalate
```

---

## Repository Structure

```
agentegrity-framework/
├── MANIFESTO.md                 # The Agentegrity Manifesto
├── README.md                    # You are here
├── LICENSE                      # Apache 2.0
├── pyproject.toml               # Package configuration
│
├── spec/                        # Framework Specification
│   ├── SPECIFICATION.md         # Full technical specification
│   ├── properties/              # Property definitions
│   │   ├── adversarial-coherence.md
│   │   ├── environmental-portability.md
│   │   └── verifiable-assurance.md
│   └── layers/                  # Layer architecture
│       ├── adversarial-layer.md
│       ├── cortical-layer.md
│       └── governance-layer.md
│
├── src/agentegrity/             # Python Reference Implementation
│   ├── __init__.py
│   ├── core/                    # Core abstractions
│   │   ├── __init__.py
│   │   ├── profile.py           # AgentProfile
│   │   ├── evaluator.py         # IntegrityEvaluator
│   │   ├── attestation.py       # Cryptographic attestation
│   │   └── monitor.py           # Runtime IntegrityMonitor
│   ├── layers/                  # Layer implementations
│   │   ├── __init__.py
│   │   ├── adversarial.py       # AdversarialLayer
│   │   ├── cortical.py          # CorticalLayer
│   │   └── governance.py        # GovernanceLayer
│   ├── properties/              # Property evaluators
│   │   ├── __init__.py
│   │   ├── coherence.py         # Adversarial coherence scoring
│   │   ├── portability.py       # Environmental portability checks
│   │   └── assurance.py         # Verifiable assurance generation
│   ├── validators/              # Built-in validators
│   │   ├── __init__.py
│   │   ├── reasoning.py         # Reasoning chain validation
│   │   ├── memory.py            # Memory integrity checks
│   │   ├── behavior.py          # Behavioral drift detection
│   │   └── tool_use.py          # Tool access validation
│   └── sdk/                     # High-level SDK utilities
│       ├── __init__.py
│       └── client.py            # AgentegrityClient
│
├── tests/                       # Test suite
│   ├── __init__.py
│   ├── test_profile.py
│   ├── test_evaluator.py
│   ├── test_layers.py
│   └── test_properties.py
│
└── examples/                    # Usage examples
    ├── basic_evaluation.py
    ├── runtime_monitoring.py
    └── custom_validator.py
```

---

## Documentation

| Document | Description |
|---|---|
| [Manifesto](MANIFESTO.md) | The founding definition of agentegrity as a discipline |
| [Specification](spec/SPECIFICATION.md) | Full technical specification (properties, layers, controls, metrics) |
| [Adversarial Coherence](spec/properties/adversarial-coherence.md) | Property 1: integrity under adversarial pressure |
| [Environmental Portability](spec/properties/environmental-portability.md) | Property 2: integrity across deployment contexts |
| [Verifiable Assurance](spec/properties/verifiable-assurance.md) | Property 3: cryptographically provable integrity |

---

## Design Principles

1. **Integrity is intrinsic, not extrinsic.** Security that only watches inputs and outputs misses what happens inside the agent. Agentegrity evaluates the agent itself.

2. **Properties over checklists.** The three properties are composable and measurable, not a compliance checklist to tick off.

3. **Framework-agnostic.** Agentegrity works with any agent framework — LangChain, CrewAI, AutoGen, Agno, custom implementations. The spec defines *what* to measure, not *how* your agent is built.

4. **Runtime-first.** Integrity is not a deployment gate. It is a continuous runtime property that can degrade, be attacked, and must be actively maintained.

5. **Cryptographic, not observational.** "We monitored the agent and it looked fine" is not assurance. Agentegrity produces attestation records that are independently verifiable.

---

## Contributing

We welcome contributions. See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

Priority areas for v1:
- Additional validators for common agent frameworks
- Property evaluation benchmarks
- Formal verification of layer interactions
- Language-specific SDK ports (Go, TypeScript, Rust)

---

## Citation

If you use the Agentegrity Framework in research or production, please cite:

```bibtex
@misc{agentegrity2026,
  title={The Agentegrity Framework: A Specification for AI Agent Integrity},
  author={Cogensec Research},
  year={2026},
  url={https://github.com/requie/Agentegrity-Framework}
}
```

---

## License

Apache License 2.0. See [LICENSE](LICENSE) for details.

---

**Agentegrity is a Cogensec Research initiative.**
