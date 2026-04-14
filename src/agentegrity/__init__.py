"""
Agentegrity Framework - The open standard for AI agent integrity.

Agentegrity defines what it means for an autonomous AI agent to be whole:
adversarially coherent, environmentally portable, and verifiably assured.
"""

__version__ = "0.2.1"

from agentegrity.claude import hooks as claude_hooks
from agentegrity.claude import report as claude_report
from agentegrity.core.attestation import AttestationChain, AttestationRecord
from agentegrity.core.evaluator import IntegrityEvaluator, IntegrityScore
from agentegrity.core.monitor import IntegrityMonitor
from agentegrity.core.profile import AgentProfile, AgentType, DeploymentContext, RiskTier
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
    "claude_hooks",
    "claude_report",
]
