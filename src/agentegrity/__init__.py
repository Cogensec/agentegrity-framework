"""
Agentegrity Framework - The open standard for AI agent integrity.

Agentegrity defines what it means for an autonomous AI agent to be whole:
adversarially coherent, environmentally portable, and verifiably assured.
"""

__version__ = "1.0.0"

from agentegrity.core.profile import AgentProfile, AgentType, DeploymentContext, RiskTier
from agentegrity.core.evaluator import IntegrityEvaluator, IntegrityScore
from agentegrity.core.attestation import AttestationRecord, AttestationChain
from agentegrity.core.monitor import IntegrityMonitor
from agentegrity.sdk.client import AgentegrityClient

__all__ = [
    "AgentProfile",
    "AgentType",
    "DeploymentContext",
    "RiskTier",
    "IntegrityEvaluator",
    "IntegrityScore",
    "AttestationRecord",
    "AttestationChain",
    "IntegrityMonitor",
    "AgentegrityClient",
]
