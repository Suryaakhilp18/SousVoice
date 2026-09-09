"""
Minimal LiveKit access-token server so any standard LiveKit frontend
(including the hosted LiveKit Agents Playground, pointed at your own
project) can join the same room as the running SousVoice agent.

This is intentionally not a custom voice frontend -- the challenge brief
explicitly names LiveKit Agents as the recommended starting point for
transport/orchestration and treats the interface as a free choice. Building
a bespoke web client here would spend hackathon time on UI plumbing instead
of on the hard voice-engineering problem (interruption & recovery) that is
actually being judged.

Run:
    python scripts/token_server.py
Then open the LiveKit Agents Playground (https://agents-playground.livekit.io),
point it at your LIVEKIT_URL, and use a token minted by this server (or the
Playground's own dev-token flow) to join the same room your agent is
serving.
"""

from __future__ import annotations

import os

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from livekit import api

load_dotenv()

app = Flask(__name__)


@app.route("/token")
def token() -> tuple:
    room = request.args.get("room", "sousvoice-demo")
    identity = request.args.get("identity", "cook")

    api_key = os.environ["LIVEKIT_API_KEY"]
    api_secret = os.environ["LIVEKIT_API_SECRET"]

    grant = api.VideoGrants(room_join=True, room=room)
    access_token = (
        api.AccessToken(api_key, api_secret)
        .with_identity(identity)
        .with_grants(grant)
        .to_jwt()
    )
    return jsonify({"token": access_token, "url": os.environ["LIVEKIT_URL"]})


if __name__ == "__main__":
    app.run(port=8000)
