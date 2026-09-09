"""Tool functions the agent's LLM can call mid-conversation.

`lookup_substitution` is deliberately slow (configurable, real network calls
in production would be ~1-3s) so it is the tool most likely to still be
in flight when the user interrupts -- exactly the case the hard voice
problem (interruption & recovery) targets. The delay is injectable via
LOOKUP_DELAY_SECONDS so both the live demo and the offline test can control
it precisely, per the "acceptance test before the demo" requirement.
"""

from __future__ import annotations

import asyncio
import os

from .recipe_data import QUANTITIES, SUBSTITUTIONS

DEFAULT_LOOKUP_DELAY_SECONDS = 2.5


def _lookup_delay_seconds() -> float:
    raw = os.environ.get("LOOKUP_DELAY_SECONDS")
    if raw is None:
        return DEFAULT_LOOKUP_DELAY_SECONDS
    try:
        return float(raw)
    except ValueError:
        return DEFAULT_LOOKUP_DELAY_SECONDS


async def lookup_substitution(ingredient: str, delay_seconds: float | None = None) -> str:
    """Simulates a slow external lookup (e.g. an ingredient-substitution API).

    This is the tool call the RIME_EVIDENCE.md stress test injects a fixed
    delay into, then interrupts mid-flight.
    """
    delay = _lookup_delay_seconds() if delay_seconds is None else delay_seconds
    await asyncio.sleep(delay)
    key = ingredient.strip().lower()
    if key in SUBSTITUTIONS:
        return f"You can substitute {ingredient} with {SUBSTITUTIONS[key]}"
    return f"I don't have a reliable substitution for {ingredient} yet."


async def lookup_quantity(ingredient: str) -> str:
    """A fast tool (near-instant) used to contrast against the slow one in
    the interruption test -- the new turn's own tool call should complete
    and be spoken normally, proving the fencing doesn't over-cancel.
    """
    await asyncio.sleep(0.05)
    key = ingredient.strip().lower()
    if key in QUANTITIES:
        return f"You need {QUANTITIES[key]} of {ingredient}."
    return f"This recipe doesn't call for {ingredient}."
