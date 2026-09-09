import {
  Room,
  RoomEvent,
  ParticipantEvent,
  Track,
  RemoteTrack,
  RemoteParticipant,
  type TranscriptionSegment,
} from 'livekit-client';
import { useSousVoiceStore } from '../store/useSousVoiceStore';
import { RECIPE_DATA } from '../data/recipe';
import { stopMicrophone } from './speechService';

let currentRoom: Room | null = null;
let audioElements: HTMLMediaElement[] = [];
let durationInterval: number | null = null;

const detectStepFromText = (text: string) => {
  const lower = text.toLowerCase();
  const stepMatch = lower.match(/\bstep\s*([1-6])\b/);
  if (stepMatch && stepMatch[1]) {
    const num = parseInt(stepMatch[1], 10);
    if (num >= 1 && num <= RECIPE_DATA.steps.length) {
      useSousVoiceStore.getState().setCurrentStep(num);
      return;
    }
  }

  const wordMap: Record<string, number> = {
    one: 1, first: 1,
    two: 2, second: 2,
    three: 3, third: 3,
    four: 4, fourth: 4,
    five: 5, fifth: 5,
    six: 6, sixth: 6,
  };

  for (const [w, n] of Object.entries(wordMap)) {
    if (lower.includes(`step ${w}`) || lower.includes(`${w} step`)) {
      useSousVoiceStore.getState().setCurrentStep(n);
      return;
    }
  }
};

export const startLiveKitSession = async (): Promise<void> => {
  const store = useSousVoiceStore.getState();
  store.setError(null);
  store.setScreen('connecting');

  const abortCtrl = new AbortController();
  const timeoutId = setTimeout(() => {
    abortCtrl.abort();
  }, 10000);

  try {
    const baseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_TOKEN_SERVER_URL) || '';
    const tokenUrl = `${baseUrl}/token?room=sousvoice-demo&identity=cook-${Math.random().toString(36).substring(2, 7)}`;

    let response: Response;
    try {
      response = await fetch(tokenUrl, { signal: abortCtrl.signal });
    } catch {
      if (abortCtrl.signal.aborted) {
        throw new Error('Connection timed out. Please check if the LiveKit token server is online.');
      }
      throw new Error(`Cannot reach token server (${tokenUrl}). Verify python scripts/token_server.py is running on port 8000.`);
    }

    if (!response.ok) {
      throw new Error(`Token server returned ${response.status}: ${response.statusText}`);
    }

    // Guard: if the server returned HTML instead of JSON (e.g. nginx/fallback page,
    // token_server.py not running), detect it before JSON.parse throws the
    // confusing "Unexpected token '<', '<!doctype'" error.
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const preview = await response.text();
      throw new Error(
        preview.trim().startsWith('<')
          ? 'Token server returned an HTML page instead of JSON — python scripts/token_server.py is likely not running on port 8000. Switch to Mock Mode to test offline.'
          : `Token server returned unexpected content-type "${contentType}". Expected JSON.`
      );
    }

    const data = await response.json();
    clearTimeout(timeoutId);

    if (!data.token || !data.url) {
      throw new Error('Malformed token response from token server.');
    }

    const room = new Room({
      adaptiveStream: true,
      dynacast: true,
      audioCaptureDefaults: {
        autoGainControl: true,
        echoCancellation: true,
        noiseSuppression: true,
      },
    });

    currentRoom = room;

    room.on(RoomEvent.Connected, () => {
      store.setScreen('live');
      store.setVoiceState('listening');

      if (durationInterval) clearInterval(durationInterval);
      durationInterval = window.setInterval(() => {
        useSousVoiceStore.getState().tickDuration();
      }, 1000);
    });

    room.on(RoomEvent.Disconnected, () => {
      endLiveKitSession();
    });

    room.on(RoomEvent.Reconnecting, () => {
      store.setVoiceState('thinking');
    });

    room.on(RoomEvent.Reconnected, () => {
      store.setVoiceState('listening');
    });

    // Remote audio track subscribed (Rime TTS from Python Agent)
    room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack) => {
      if (track.kind === Track.Kind.Audio) {
        const el = track.attach();
        audioElements.push(el);
        document.body.appendChild(el);

        // When audio is actually playing, mark as speaking
        el.onplay = () => {
          useSousVoiceStore.getState().setVoiceState('speaking');
        };

        el.onended = () => {
          useSousVoiceStore.getState().setVoiceState('listening');
        };
      }
    });

    room.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) => {
      track.detach().forEach((el) => {
        el.remove();
        audioElements = audioElements.filter((item) => item !== el);
      });
    });

    // Handle agent state updates
    const updateVoiceState = (agentParticipant?: RemoteParticipant) => {
      const local = room.localParticipant;
      const agent = agentParticipant || Array.from(room.remoteParticipants.values())[0];

      const cookSpeaking = local?.isSpeaking ?? false;
      const agentSpeaking = agent?.isSpeaking ?? false;
      const agentAttr = agent?.attributes['lk.agent.state'];

      if (cookSpeaking && (agentSpeaking || agentAttr === 'thinking' || agentAttr === 'speaking')) {
        // Interruption
        useSousVoiceStore.getState().markInterrupted();
        return;
      }

      if (cookSpeaking) {
        useSousVoiceStore.getState().setVoiceState('user-speaking');
      } else if (agentAttr === 'thinking') {
        useSousVoiceStore.getState().setVoiceState('thinking');
      } else if (agentSpeaking || agentAttr === 'speaking') {
        useSousVoiceStore.getState().setVoiceState('speaking');
      } else {
        useSousVoiceStore.getState().setVoiceState('listening');
      }
    };

    room.localParticipant.on(ParticipantEvent.IsSpeakingChanged, () => {
      updateVoiceState();
    });

    room.on(RoomEvent.ParticipantAttributesChanged, (_changed, participant) => {
      if (participant instanceof RemoteParticipant) {
        updateVoiceState(participant);
      }
    });

    // Transcription events
    room.on(
      RoomEvent.TranscriptionReceived,
      (segments: TranscriptionSegment[], participant?: any) => {
        const isCook = participant?.identity?.startsWith('cook') ?? true;
        const text = segments.map((s) => s.text).join(' ').trim();

        if (!text) return;

        const isFinal = segments.every((s) => s.final);

        if (isCook) {
          store.addTranscriptMessage({
            id: `transcription-${Date.now()}`,
            speaker: 'cook',
            text,
            timestamp: Date.now(),
            isFinal,
          });
        } else {
          store.addTranscriptMessage({
            id: `transcription-${Date.now()}`,
            speaker: 'agent',
            text,
            timestamp: Date.now(),
            isFinal,
            interrupted: false,
          });

          // If step instruction mentioned, advance progress rail
          detectStepFromText(text);
        }
      }
    );

    // Connect to room and publish microphone
    await room.connect(data.url, data.token);
    await room.localParticipant.setMicrophoneEnabled(true);
  } catch (err: any) {
    clearTimeout(timeoutId);
    endLiveKitSession();
    store.setError({
      title: 'Unable to Connect to SousVoice',
      message: err?.message || 'Connection failed.',
      actionableStep: 'Verify python scripts/token_server.py is running on port 8000, or toggle Mock Mode to test offline.',
    });
  }
};

export const endLiveKitSession = (): void => {
  if (durationInterval) {
    clearInterval(durationInterval);
    durationInterval = null;
  }

  stopMicrophone();

  audioElements.forEach((el) => {
    el.pause();
    el.remove();
  });
  audioElements = [];

  if (currentRoom) {
    currentRoom.disconnect();
    currentRoom = null;
  }

  const store = useSousVoiceStore.getState();
  store.setMicLevel(0);
  store.setVoiceState('idle');
  store.setScreen('ended');
};
