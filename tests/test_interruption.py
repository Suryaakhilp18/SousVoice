"""
Reproducible, offline acceptance test for the hard voice claim in
RIME_EVIDENCE.md:

    "When the cook interrupts SousVoice mid-response -- including while a
    slow ingredient-substitution lookup is still in flight -- queued audio
    stops immediately, the stale lookup result is never spoken, and the
    cook's new question is answered instead, using only what they actually
    asked."

This follows the exact "Full-duplex test example" procedure from the
challenge brief: introduce a fixed delay into a tool call, interrupt while
it is pending, change part of the request, and verify that (1) queued audio
stops promptly, (2) the updated instruction reaches the application,
(3) stale tool results are not spoken as current, (4) background work is
cancelled or reconciled correctly, and (5) the final spoken response
reflects what the user actually heard and requested.

No network, no API keys, no LiveKit/Rime dependency -- this exercises
agent/interruption.py directly so it can be re-run by anyone, including CI,
in well under a second.

Run:
    python -m unittest tests.test_interruption -v
"""

from __future__ import annotations

import asyncio
import time
import unittest

from agent.interruption import TurnController
from agent.tools import lookup_quantity, lookup_substitution


class FakeTTS:
    """Stand-in for Rime playback latency. Real Rime streaming audio takes
    real wall-clock time to play out loud; this coroutine models that with
    a plain sleep so the test can assert on cancellation timing without an
    audio device or network access.
    """

    def __init__(self, duration_seconds: float) -> None:
        self.duration_seconds = duration_seconds
        self.ran_to_completion = False

    async def play(self) -> None:
        await asyncio.sleep(self.duration_seconds)
        self.ran_to_completion = True


class InterruptionAndRecoveryTest(unittest.IsolatedAsyncioTestCase):
    async def test_stale_lookup_and_audio_are_discarded_on_interrupt(self) -> None:
        turns = TurnController()

        # --- Turn 1: cook asks for a substitution; the lookup is slow. ---
        gen1 = turns.new_turn()
        self.assertEqual(gen1, 1)

        filler_tts = FakeTTS(duration_seconds=1.0)
        speak_task = asyncio.create_task(
            turns.speak(gen1, "Let me check that for you...", filler_tts.play())
        )
        substitution_task = asyncio.create_task(
            turns.run_tool(gen1, lookup_substitution("buttermilk", delay_seconds=2.5))
        )

        # Let both start, well before either resolves (fixed delay = 2.5s /
        # filler TTS = 1.0s).
        await asyncio.sleep(0.2)
        self.assertFalse(filler_tts.ran_to_completion)

        # --- Interruption: the cook talks over the assistant and changes
        # the request entirely, asking about a different ingredient's
        # quantity instead. ---
        interrupt_start = time.monotonic()
        gen2 = turns.new_turn()
        interrupt_elapsed = time.monotonic() - interrupt_start

        self.assertEqual(gen2, 2)
        # Requirement: "queued Rime audio stops promptly." The fence itself
        # is synchronous; assert it is effectively instantaneous.
        self.assertLess(interrupt_elapsed, 0.01)

        # --- The turn 2 request: fast tool, should complete normally. ---
        quantity_result = await turns.run_tool(gen2, lookup_quantity("egg"))
        self.assertEqual(quantity_result, "You need 1 egg of egg.")
        spoke_new = await turns.speak(
            gen2, quantity_result, FakeTTS(duration_seconds=0.05).play()
        )
        self.assertTrue(spoke_new)

        # --- Now let the stale turn-1 work actually resolve/settle. ---
        spoke_old = await speak_task
        old_result = await substitution_task
        await asyncio.sleep(0)  # let cancellation propagate fully

        # Requirement: "stale tool results are not spoken as current."
        self.assertIsNone(old_result)
        # Requirement: queued audio for the superseded turn never completes
        # and is never marked as spoken.
        self.assertFalse(spoke_old)
        self.assertFalse(filler_tts.ran_to_completion)

        # Requirement: "background work is cancelled or reconciled
        # correctly."
        self.assertGreaterEqual(turns.cancelled_tool_count, 1)

        # Requirement: "the final spoken response reflects what the user
        # actually heard and requested" -- the transcript of what was
        # actually spoken must contain only the turn-2 answer, never the
        # stale substitution text.
        spoken_texts = [e.text for e in turns.spoken_log]
        self.assertEqual(spoken_texts, ["You need 1 egg of egg."])
        self.assertTrue(all("buttermilk" not in t for t in spoken_texts))

    async def test_uninterrupted_turn_completes_and_is_spoken_normally(self) -> None:
        """Control case: fencing must not over-cancel a turn nobody
        interrupted. Guards against a trivial "cancel everything always"
        implementation passing the interruption test by accident.
        """
        turns = TurnController()
        gen = turns.new_turn()

        result = await turns.run_tool(gen, lookup_quantity("flour"))
        self.assertEqual(result, "You need 1 cup of flour.")

        spoken = await turns.speak(gen, result, FakeTTS(duration_seconds=0.05).play())
        self.assertTrue(spoken)
        self.assertEqual(turns.cancelled_tool_count, 0)
        self.assertEqual([e.text for e in turns.spoken_log], [result])

    async def test_second_interruption_only_cancels_stale_work(self) -> None:
        """Three turns in a row, each interrupting the last, none of the
        first two's slow lookups may ever surface."""
        turns = TurnController()

        gen1 = turns.new_turn()
        t1 = asyncio.create_task(
            turns.run_tool(gen1, lookup_substitution("butter", delay_seconds=1.0))
        )
        await asyncio.sleep(0.05)

        gen2 = turns.new_turn()
        t2 = asyncio.create_task(
            turns.run_tool(gen2, lookup_substitution("egg", delay_seconds=1.0))
        )
        await asyncio.sleep(0.05)

        gen3 = turns.new_turn()
        result3 = await turns.run_tool(gen3, lookup_quantity("sugar"))

        r1 = await t1
        r2 = await t2

        self.assertIsNone(r1)
        self.assertIsNone(r2)
        self.assertEqual(result3, "You need 1 tablespoon of sugar.")
        self.assertGreaterEqual(turns.cancelled_tool_count, 2)


if __name__ == "__main__":
    unittest.main()
