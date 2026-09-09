"""
SousVoice -- a hands-free cooking assistant that reads recipe steps aloud
and lets the cook interrupt at any point without touching a screen.

Target user: someone actively cooking with wet or full hands who needs to
ask "how much salt again?", "what can I use instead of buttermilk?", or
"skip ahead" *while the assistant is already talking or already looking
something up* -- and get the right answer to what they just asked, not a
stale answer to whatever the assistant was mid-sentence on.

Rime provides all spoken output (see RIME_EVIDENCE.md and README.md for the
exact model/voice/endpoint/transport). LiveKit Agents provides realtime
transport, VAD-based turn detection, and STT/LLM orchestration.

Run:
    python -m agent.main dev

Requires a LiveKit project, a Rime API key, an LLM key and an STT key --
see .env.example. This file is the "live" path; agent/interruption.py's
TurnController is unit-testable offline (see tests/test_interruption.py)
and is the actual hard-engineering contribution being judged.
"""

from __future__ import annotations

import logging
import os

from dotenv import load_dotenv

from livekit import agents
from livekit.agents import (
    Agent,
    AgentSession,
    RunContext,
    function_tool,
)
from livekit.plugins import deepgram, openai, rime, silero

from .interruption import TurnController
from .recipe_data import RECIPE
from .tools import lookup_quantity, lookup_substitution

load_dotenv()

logger = logging.getLogger("sousvoice")

# Rime configuration -- kept explicit and centralized so the exact shipped
# path is easy to audit against RIME_EVIDENCE.md and the README.
RIME_MODEL = os.environ.get("RIME_MODEL", "mistv2")
RIME_SPEAKER = os.environ.get("RIME_SPEAKER", "abbie")
RIME_LANG = os.environ.get("RIME_LANG", "eng")

# The controller is process-global per session: one cooking session, one
# fenced conversation. A new AgentSession creates its own instance.


class SousVoiceAgent(Agent):
    def __init__(self, turn_controller: TurnController) -> None:
        self._turns = turn_controller
        steps_text = " ".join(
            f"Step {i + 1}: {s}" for i, s in enumerate(RECIPE["steps"])
        )
        super().__init__(
            instructions=(
                "You are SousVoice, a calm, concise hands-free cooking "
                "assistant guiding a home cook through a recipe by voice. "
                f"The recipe is '{RECIPE['name']}' for {RECIPE['servings']} "
                f"servings. Steps: {steps_text} "
                "Read one step at a time unless asked to skip or repeat. "
                "Keep every spoken turn short -- a sentence or two. If the "
                "cook asks about a substitution or an ingredient amount, "
                "use the matching tool rather than guessing. If they "
                "interrupt you, address their new question directly; do "
                "not finish or reference what you were saying before."
            ),
        )

    @function_tool()
    async def substitute_ingredient(
        self, context: RunContext, ingredient: str
    ) -> str:
        """Look up a substitution for an ingredient the cook doesn't have.
        This call is intentionally slow (simulates a real external API) --
        it is the call most likely to be interrupted mid-flight.
        """
        gen = self._turns.generation
        result = await self._turns.run_tool(gen, lookup_substitution(ingredient))
        if result is None:
            # Stale: the cook moved on before this resolved. Returning an
            # empty-ish signal keeps the LLM from narrating a dead lookup.
            return "(superseded by a newer request -- do not mention this)"
        return result

    @function_tool()
    async def get_quantity(self, context: RunContext, ingredient: str) -> str:
        """Look up how much of an ingredient the recipe calls for."""
        gen = self._turns.generation
        result = await self._turns.run_tool(gen, lookup_quantity(ingredient))
        if result is None:
            return "(superseded by a newer request -- do not mention this)"
        return result


async def entrypoint(ctx: agents.JobContext) -> None:
    await ctx.connect()

    turns = TurnController()

    session = AgentSession(
        vad=silero.VAD.load(),
        stt=deepgram.STT(model="nova-3", language="en"),
        llm=openai.LLM(model="gpt-4o-mini"),
        tts=rime.TTS(
            model=RIME_MODEL,
            speaker=RIME_SPEAKER,
            lang=RIME_LANG,
        ),
        # LiveKit's own barge-in handling stops local playback; the
        # TurnController additionally fences tool calls and the logical
        # "what did we actually say" transcript, which LiveKit does not
        # track for you. See agent/interruption.py.
        allow_interruptions=True,
    )

    @session.on("user_state_changed")
    def _on_user_state_changed(ev) -> None:
        # New user speech (including a barge-in interruption) bumps the
        # fence immediately -- synchronous, so it happens before any stale
        # tool result or queued audio can land.
        if getattr(ev, "new_state", None) == "speaking":
            turns.new_turn()

    agent = SousVoiceAgent(turn_controller=turns)
    await session.start(agent=agent, room=ctx.room)

    await session.generate_reply(
        instructions=(
            "Greet the cook briefly, name the recipe, and read step 1."
        )
    )


if __name__ == "__main__":
    agents.cli.run_app(agents.WorkerOptions(entrypoint_fnc=entrypoint))
