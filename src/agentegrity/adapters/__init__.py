"""Framework adapters for integrating agentegrity with agent SDKs."""

from agentegrity.adapters.base import FrameworkAdapter, FrameworkEvent
from agentegrity.adapters.claude import ClaudeAdapter
from agentegrity.adapters.crewai import CrewAIAdapter
from agentegrity.adapters.google_adk import GoogleADKAdapter
from agentegrity.adapters.langchain import LangChainAdapter
from agentegrity.adapters.openai_agents import OpenAIAgentsAdapter

__all__ = [
    "ClaudeAdapter",
    "CrewAIAdapter",
    "FrameworkAdapter",
    "FrameworkEvent",
    "GoogleADKAdapter",
    "LangChainAdapter",
    "OpenAIAgentsAdapter",
]
