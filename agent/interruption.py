"""
SousVoice turn/generation controller.

This is the piece of the application that makes "interruption and recovery"
actually true rather than aspirational. It is deliberately independent of
LiveKit, Rime, or any network call, so its correctness can be verified with
a plain, fast, offline unit test (see tests/test_interruption.py) instead of
only being "proven" by a live demo.

Core idea: every user turn is stamped with a monotonically increasing
generation id. Tool calls and TTS playback started for a generation are
tagged with it. When the user interrupts:

  1. The current generation counter is bumped immediately (synchronous,
     sub-millisecond) -- this is the "fence".
  2. Any in-flight TTS task is cancelled, which in the real agent stops
     queued Rime audio and local playback.
  3. Any in-flight tool task is cancelled where possible. If it cannot be
     cancelled in time (already past its await point) its result is still
     discarded on arrival, because run_tool() checks the fence before
     handing the result back to the caller.

Nothing downstream (the LLM prompt, the spoken response, the transcript)
ever sees a result that was computed for a stale generation.
"""

from __future__ import annotations

import asyncio
import time
from dataclasses import dataclass, field
from typing import Any, Awaitable, Callable, Optional


@dataclass
class SpokenEvent:
    """One thing that was actually spoken to the user (or would have been,
    in the mocked/test TTS path). This is the ground-truth transcript used
    to verify that stale content never reaches the user."""

    generation: int
    text: str
    at: float = field(default_factory=time.monotonic)


class TurnController:
    """Generation-fenced coordinator for tool calls and TTS playback."""

    def __init__(self) -> None:
        self.generation: int = 0
        self._active_tts_task: Optional[asyncio.Task] = None
        self._active_tool_tasks: dict[int, set[asyncio.Task]] = {}
        self.spoken_log: list[SpokenEvent] = []
        self.cancelled_tool_count: int = 0
        self.discarded_stale_results: int = 0

    # ---- turn lifecycle -------------------------------------------------

    def new_turn(self) -> int:
        """Called the instant the user starts speaking (including barge-in
        interruptions). Bumps the fence and cancels everything stale.
        Synchronous and cheap on purpose: this must not wait on I/O.
        """
        self.generation += 1
        gen = self.generation

        if self._active_tts_task is not None and not self._active_tts_task.done():
            self._active_tts_task.cancel()

        for old_gen, tasks in list(self._active_tool_tasks.items()):
            if old_gen == gen:
                continue
            for t in tasks:
                if not t.done():
                    t.cancel()
                    self.cancelled_tool_count += 1
            del self._active_tool_tasks[old_gen]

        return gen

    # ---- tool calls -------------------------------------------------------

    async def run_tool(self, gen: int, coro: Awaitable[Any]) -> Optional[Any]:
        """Run a tool coroutine under the given generation. Returns the
        result only if that generation is still current when the tool
        finishes; otherwise returns None and the caller must not act on it.
        """
        task = asyncio.ensure_future(coro)
        self._active_tool_tasks.setdefault(gen, set()).add(task)
        try:
            result = await task
        except asyncio.CancelledError:
            self.discarded_stale_results += 1
            return None
        finally:
            self._active_tool_tasks.get(gen, set()).discard(task)

        if gen != self.generation:
            # Race: the tool finished right as a newer turn started, before
            # cancellation reached it. Still must not be spoken.
            self.discarded_stale_results += 1
            return None
        return result

    # ---- speech -----------------------------------------------------------

    async def speak(self, gen: int, text: str, tts_coro: Awaitable[Any]) -> bool:
        """Play (or, in tests, simulate) TTS for `text` under generation
        `gen`. Returns True if it was actually spoken, False if it was
        skipped/cancelled because a newer turn pre-empted it.
        """
        if gen != self.generation:
            return False

        task = asyncio.ensure_future(tts_coro)
        self._active_tts_task = task
        try:
            await task
        except asyncio.CancelledError:
            return False

        if gen != self.generation:
            # Finished right as we were pre-empted -- do not log as spoken.
            return False

        self.spoken_log.append(SpokenEvent(generation=gen, text=text))
        return True
