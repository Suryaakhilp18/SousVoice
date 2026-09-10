// speechService.ts: Enhanced Hands-Free Microphone, Multilingual Speech Recognition & Synthesis

import type { SupportedLanguage } from './localization';

let activeUtterance: SpeechSynthesisUtterance | null = null;
let audioContext: AudioContext | null = null;
let micStream: MediaStream | null = null;
let analyser: AnalyserNode | null = null;
let animFrameId: number | null = null;
let recognitionInstance: any = null;
let silenceTimer: any = null;
let interimTranscriptAccumulator = '';

let lastSpokenNormalized = '';
let speechEndedTimestamp = 0;
let lastEmittedCleanText = '';
let lastEmittedTime = 0;
let currentActiveLanguage: SupportedLanguage = 'en';

export const isSpeakingOutLoud = (): boolean => {
  return activeUtterance !== null;
};

export const setSpeechServiceLanguage = (lang: SupportedLanguage) => {
  currentActiveLanguage = lang;
  if (recognitionInstance) {
    try {
      recognitionInstance.lang = lang === 'hi' ? 'hi-IN' : lang === 'te' ? 'te-IN' : 'en-US';
    } catch {}
  }
};

/**
 * Filter out acoustic echo when the assistant's own voice comes out of the device
 * speakers and is picked up by the microphone.
 */
export const isEchoOfAssistant = (incomingText: string): boolean => {
  const clean = incomingText.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!clean || clean.length < 2) return true;

  // Genuine cook question or command starters across English, Hindi, and Telugu
  const userStarters = [
    // English
    'wait', 'stop', 'hold', 'pause', 'hang on',
    'how', 'what', 'why', 'when', 'where', 'which', 'who',
    'can', 'could', 'should', 'would', 'will',
    'is', 'are', 'do', 'does', 'did', 'have', 'has',
    'tell', 'repeat', 'read', 'explain', 'substitute', 'replace', 'instead',
    'next', 'back', 'step', 'done', 'finished', 'ready',
    // Hindi
    'रुक', 'रुको', 'रुको!', 'ठहरो', 'अगला', 'आगे', 'स्टेप', 'क्या', 'कैसे', 'कितना', 'कितनी', 'नमक', 'मिर्च', 'हो गया', 'तैयार',
    // Telugu
    'ఆగు', 'ఆగండి', 'ఆగండి!', 'తరువాత', 'ముందుకు', 'దశ', 'ఏంటి', 'ఎలా', 'ఎంత', 'ఉప్పు', 'కారం', 'పూర్తయింది', 'సిద్ధం'
  ];

  for (const starter of userStarters) {
    if (clean === starter || clean.startsWith(starter + ' ') || clean.startsWith(starter)) {
      return false;
    }
  }

  // If assistant is actively speaking or finished less than 1200ms ago:
  const isRecentSpeech = isSpeakingOutLoud() || Date.now() - speechEndedTimestamp < 1200;
  if (!isRecentSpeech || !lastSpokenNormalized) return false;

  // If incoming text is inside the spoken text:
  if (lastSpokenNormalized.includes(clean)) {
    return true;
  }

  // Check word overlap ratio
  const incomingWords = clean.split(' ').filter((w) => w.length > 2);
  if (incomingWords.length > 0) {
    const spokenWords = new Set(lastSpokenNormalized.split(' ').filter((w) => w.length > 2));
    let matchCount = 0;
    for (const word of incomingWords) {
      if (spokenWords.has(word)) matchCount++;
    }
    if (matchCount / incomingWords.length >= 0.5) {
      return true;
    }
  }

  return false;
};

/**
 * Validate that speech contains genuine, intentional words rather than noise or single syllables.
 */
const isMeaningfulSpeech = (text: string): boolean => {
  const clean = text.trim();
  if (!clean || clean.length < 3) return false;

  // Quick commands in all supported languages
  const quickCommands = [
    'next', 'stop', 'wait', 'done', 'back', 'pause', 'repeat', 'ready',
    'रुको', 'अगला', 'आगे', 'हो गया', 'रुकिए',
    'ఆగు', 'ఆగండి', 'తరువాత', 'పూర్తయింది'
  ];
  if (quickCommands.includes(clean.toLowerCase())) return true;

  const words = clean.split(/\s+/).filter((w) => w.length >= 1);
  return words.length >= 2 || (words.length >= 1 && clean.length >= 6);
};

export const speakText = (
  text: string,
  onEnd?: () => void,
  language: SupportedLanguage = currentActiveLanguage
): void => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onEnd?.();
    return;
  }

  cancelSpeech();
  try {
    window.speechSynthesis.resume();
  } catch {}

  lastSpokenNormalized = text.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = language === 'hi' || language === 'te' ? 0.95 : 1.05;
  utterance.pitch = 1.0;

  const targetLocale = language === 'hi' ? 'hi-IN' : language === 'te' ? 'te-IN' : 'en-US';
  utterance.lang = targetLocale;

  const voices = window.speechSynthesis.getVoices();
  // Find high quality voice matching the selected language locale
  const preferredVoice =
    voices.find((v) => v.lang.toLowerCase().replace('_', '-').startsWith(language === 'hi' ? 'hi' : language === 'te' ? 'te' : 'en')) ||
    voices.find((v) => v.lang.startsWith(language));

  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  activeUtterance = utterance;

  utterance.onend = () => {
    activeUtterance = null;
    speechEndedTimestamp = Date.now();
    onEnd?.();
  };

  utterance.onerror = (e) => {
    if (e.error !== 'canceled' && e.error !== 'interrupted') {
      console.warn('Speech synthesis error:', e);
    }
    activeUtterance = null;
    speechEndedTimestamp = Date.now();
    onEnd?.();
  };

  window.speechSynthesis.speak(utterance);
};

export const cancelSpeech = (): void => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {}
    activeUtterance = null;
    speechEndedTimestamp = Date.now();
  }
};

export const startMicrophone = async (
  onVolume: (level: number) => void,
  onSpeechRecognized?: (text: string) => void,
  onSpeechInterim?: (interim: string) => void,
  language: SupportedLanguage = currentActiveLanguage
): Promise<boolean> => {
  currentActiveLanguage = language;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    micStream = stream;

    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
      audioContext = new AudioCtx();
      const source = audioContext.createMediaStreamSource(stream);
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const checkVolume = () => {
        if (!analyser) return;
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        onVolume(normalized);
        animFrameId = requestAnimationFrame(checkVolume);
      };

      animFrameId = requestAnimationFrame(checkVolume);
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition && onSpeechRecognized) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language === 'hi' ? 'hi-IN' : language === 'te' ? 'te-IN' : 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: any) => {
        let interimText = '';
        let finalText = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcriptChunk = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalText += transcriptChunk;
          } else {
            interimText += transcriptChunk;
          }
        }

        const trimmedInterim = interimText.trim();
        if (trimmedInterim && onSpeechInterim) {
          if (!isEchoOfAssistant(trimmedInterim)) {
            interimTranscriptAccumulator = trimmedInterim;
            onSpeechInterim(trimmedInterim);

            if (!isSpeakingOutLoud() && isMeaningfulSpeech(trimmedInterim)) {
              if (silenceTimer) clearTimeout(silenceTimer);
              silenceTimer = setTimeout(() => {
                const toEmit = interimTranscriptAccumulator.trim();
                interimTranscriptAccumulator = '';
                if (isMeaningfulSpeech(toEmit) && !isEchoOfAssistant(toEmit)) {
                  const now = Date.now();
                  if (toEmit.toLowerCase() !== lastEmittedCleanText || now - lastEmittedTime > 2000) {
                    lastEmittedCleanText = toEmit.toLowerCase();
                    lastEmittedTime = now;
                    onSpeechRecognized(toEmit);
                  }
                }
              }, 1400);
            }
          }
        }

        const trimmedFinal = finalText.trim();
        if (trimmedFinal) {
          if (silenceTimer) clearTimeout(silenceTimer);
          interimTranscriptAccumulator = '';

          if (!isEchoOfAssistant(trimmedFinal) && isMeaningfulSpeech(trimmedFinal)) {
            const now = Date.now();
            if (trimmedFinal.toLowerCase() !== lastEmittedCleanText || now - lastEmittedTime > 1500) {
              lastEmittedCleanText = trimmedFinal.toLowerCase();
              lastEmittedTime = now;
              onSpeechRecognized(trimmedFinal);
            }
          }
        }
      };

      recognition.onend = () => {
        if (micStream && micStream.active) {
          try {
            recognition.start();
          } catch {}
        }
      };

      recognition.onerror = (err: any) => {
        if (err.error !== 'no-speech' && err.error !== 'aborted') {
          console.warn('SpeechRecognition warning:', err.error);
        }
      };

      try {
        recognition.start();
        recognitionInstance = recognition;
      } catch (e) {
        console.warn('Recognition start failed:', e);
      }
    }

    return true;
  } catch (err) {
    console.warn('Microphone access not granted:', err);
    return false;
  }
};

export const stopMicrophone = (): void => {
  if (silenceTimer) {
    clearTimeout(silenceTimer);
    silenceTimer = null;
  }
  interimTranscriptAccumulator = '';
  lastEmittedCleanText = '';
  lastEmittedTime = 0;

  if (animFrameId) {
    cancelAnimationFrame(animFrameId);
    animFrameId = null;
  }

  if (recognitionInstance) {
    try {
      recognitionInstance.stop();
      recognitionInstance.abort();
    } catch {}
    recognitionInstance = null;
  }

  if (micStream) {
    micStream.getTracks().forEach((track) => track.stop());
    micStream = null;
  }

  if (audioContext && audioContext.state !== 'closed') {
    try {
      audioContext.close();
    } catch {}
    audioContext = null;
  }
  analyser = null;
};
