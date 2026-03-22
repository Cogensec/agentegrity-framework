"""
Agent Profile - the identity and capability descriptor for any agent under
agentegrity evaluation.

Every agent must be described by an AgentProfile before integrity evaluation
can begin. The profile defines what the agent is, what it can do, where it
runs, and how much risk it carries.
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any


class AgentType(str, Enum):
    """Classification of agent autonomy and interaction model."""

    CONVERSATIONAL = "conversational"
    TOOL_USING = "tool_using"
    AUTONOMOUS = "autonomous"
    MULTI_AGENT = "multi_agent"
    EMBODIED = "embodied"


class DeploymentContext(str, Enum):
    """The environment in which the agent operates."""

    CLOUD = "cloud"
    EDGE = "edge"
    HYBRID = "hybrid"
    MULTI_AGENT = "multi_agent"
    FEDERATED = "federated"
    PHYSICAL = "physical"


class RiskTier(str, Enum):
    """
    Organizational risk classification. Determines default evaluation
    thresholds, monitoring frequency, and escalation sensitivity.
    """

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


# Standard capability identifiers
CAPABILITY_TOOL_USE = "tool_use"
CAPABILITY_MEMORY_ACCESS = "memory_access"
CAPABILITY_MULTI_AGENT_COMM = "multi_agent_comm"
CAPABILITY_CODE_EXECUTION = "code_execution"
CAPABILITY_WEB_ACCESS = "web_access"
CAPABILITY_FILE_SYSTEM = "file_system"
CAPABILITY_PHYSICAL_ACTUATION = "physical_actuation"
CAPABILITY_FINANCIAL_TRANSACTIONS = "financial_transactions"


@dataclass
class AgentProfile:
    """
    Describes an AI agent for agentegrity evaluation.

    Parameters
    ----------
    agent_id : str, optional
        Unique identifier. Auto-generated if not provided.
    name : str, optional
        Human-readable agent name.
    agent_type : AgentType
        Classification of the agent's autonomy model.
    capabilities : list[str]
        What the agent can do. Use CAPABILITY_* constants or custom strings.
    deployment_context : DeploymentContext
        Where the agent runs.
    risk_tier : RiskTier
        Organizational risk classification.
    framework : str, optional
        Agent framework (e.g., "langchain", "crewai", "autogen", "custom").
    model_provider : str, optional
        LLM provider (e.g., "openai", "anthropic", "google", "open_source").
    model_id : str, optional
        Specific model identifier (e.g., "gpt-4o", "claude-sonnet-4-20250514").
    metadata : dict
        Extensible metadata for domain-specific information.

    Examples
    --------
    >>> profile = AgentProfile(
    ...     name="research-assistant",
    ...     agent_type=AgentType.TOOL_USING,
    ...     capabilities=["tool_use", "web_access", "memory_access"],
    ...     deployment_context=DeploymentContext.CLOUD,
    ...     risk_tier=RiskTier.MEDIUM
    ... )
    """

    agent_type: AgentType
    capabilities: list[str]
    deployment_context: DeploymentContext
    risk_tier: RiskTier
    agent_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    name: str | None = None
    framework: str | None = None
    model_provider: str | None = None
    model_id: str | None = None
    metadata: dict[str, Any] = field(default_factory=dict)
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    def has_capability(self, capability: str) -> bool:
        """Check if the agent has a specific capability."""
        return capability in self.capabilities

    @property
    def is_autonomous(self) -> bool:
        """Whether the agent operates with significant autonomy."""
        return self.agent_type in (
            AgentType.AUTONOMOUS,
            AgentType.MULTI_AGENT,
            AgentType.EMBODIED,
        )

    @property
    def is_embodied(self) -> bool:
        """Whether the agent interacts with the physical world."""
        return (
            self.agent_type == AgentType.EMBODIED
            or self.deployment_context == DeploymentContext.PHYSICAL
            or self.has_capability(CAPABILITY_PHYSICAL_ACTUATION)
        )

    @property
    def input_channels(self) -> list[str]:
        """
        Enumerate the input channels this agent exposes based on its
        capabilities. Used by the adversarial layer for attack surface mapping.
        """
        channels = ["direct_prompt"]  # All agents have this

        if self.has_capability(CAPABILITY_TOOL_USE):
            channels.append("tool_responses")
        if self.has_capability(CAPABILITY_MEMORY_ACCESS):
            channels.append("memory_reads")
        if self.has_capability(CAPABILITY_MULTI_AGENT_COMM):
            channels.append("peer_messages")
        if self.has_capability(CAPABILITY_WEB_ACCESS):
            channels.append("web_content")
        if self.has_capability(CAPABILITY_CODE_EXECUTION):
            channels.append("code_outputs")
        if self.has_capability(CAPABILITY_PHYSICAL_ACTUATION):
            channels.append("sensor_inputs")

        return channels

    def to_dict(self) -> dict[str, Any]:
        """Serialize the profile to a dictionary."""
        return {
            "agent_id": self.agent_id,
            "name": self.name,
            "agent_type": self.agent_type.value,
            "capabilities": self.capabilities,
            "deployment_context": self.deployment_context.value,
            "risk_tier": self.risk_tier.value,
            "framework": self.framework,
            "model_provider": self.model_provider,
            "model_id": self.model_id,
            "metadata": self.metadata,
            "created_at": self.created_at.isoformat(),
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> AgentProfile:
        """Deserialize a profile from a dictionary."""
        return cls(
            agent_id=data.get("agent_id", str(uuid.uuid4())),
            name=data.get("name"),
            agent_type=AgentType(data["agent_type"]),
            capabilities=data["capabilities"],
            deployment_context=DeploymentContext(data["deployment_context"]),
            risk_tier=RiskTier(data["risk_tier"]),
            framework=data.get("framework"),
            model_provider=data.get("model_provider"),
            model_id=data.get("model_id"),
            metadata=data.get("metadata", {}),
        )

    def __repr__(self) -> str:
        label = self.name or self.agent_id[:8]
        return (
            f"AgentProfile({label!r}, type={self.agent_type.value}, "
            f"risk={self.risk_tier.value}, channels={len(self.input_channels)})"
        )
