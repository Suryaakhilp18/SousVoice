import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { AgentVoiceState } from '../types';
import { Ear, Loader2, Volume2, ZapOff, Mic } from 'lucide-react';
import { useSousVoiceStore } from '../store/useSousVoiceStore';
import { getTranslation } from '../services/localization';

interface VoiceOrbVisualizerProps {
  state: AgentVoiceState;
  micLevel?: number;
}

export const VoiceOrbVisualizer: React.FC<VoiceOrbVisualizerProps> = ({
  state,
  micLevel = 0,
}) => {
  const { language } = useSousVoiceStore();
  const t = getTranslation(language);

  const isSpeaking = state === 'speaking';
  const isInterrupted = state === 'interrupted';
  const isThinking = state === 'thinking';
  const isUserSpeaking = state === 'user-speaking';

  const getStateMeta = () => {
    switch (state) {
      case 'user-speaking':
        return {
          title: t.hearingYou,
          subtitle: t.hearingYouSubtitle,
          color: 'var(--color-amber)',
          glowColor: 'rgba(245,158,11,0.22)',
          icon: <Mic className="w-8 h-8 text-black" />,
          statusText: 'Listening to Cook',
        };
      case 'thinking':
        return {
          title: t.thinking,
          subtitle: t.thinkingSubtitle,
          color: 'var(--color-amber)',
          glowColor: 'rgba(245,158,11,0.22)',
          icon: <Loader2 className="w-8 h-8 text-black animate-spin" />,
          statusText: 'AI Processing',
        };
      case 'speaking':
        return {
          title: t.speaking,
          subtitle: t.speakingSubtitle,
          color: 'var(--color-terracotta)',
          glowColor: 'rgba(220,90,60,0.25)',
          icon: <Volume2 className="w-8 h-8 text-white" />,
          statusText:
            language === 'te'
              ? 'TELUGU VOICE ACTIVE'
              : language === 'hi'
              ? 'HINDI VOICE ACTIVE'
              : 'RIME TTS ACTIVE',
        };
      case 'interrupted':
        return {
          title: t.interruptedTitle,
          subtitle: t.interruptedSubtitle,
          color: 'var(--color-crimson)',
          glowColor: 'rgba(220,38,38,0.22)',
          icon: <ZapOff className="w-8 h-8 text-white animate-bounce" />,
          statusText: 'BARGE-IN FENCED',
        };
      case 'listening':
      case 'idle':
      default:
        return {
          title: t.voiceReady,
          subtitle: t.voiceReadySubtitle,
          color: 'var(--color-emerald)',
          glowColor: 'rgba(16,185,129,0.18)',
          icon: <Ear className="w-8 h-8 text-black" />,
          statusText: 'Hands-Free Mic Active',
        };
    }
  };

  const meta = getStateMeta();

  return (
    <motion.div
      className="relative flex flex-col items-center justify-between p-4 sm:p-5 bg-kitchen-surface rounded-2xl shadow-kitchen w-full min-h-[220px] shrink-0"
      style={{
        border: '2px solid',
        borderColor: isSpeaking
          ? 'var(--color-terracotta)'
          : isInterrupted
          ? 'var(--color-crimson)'
          : isThinking
          ? 'var(--color-amber)'
          : 'var(--border-subtle)',
        boxShadow: isSpeaking
          ? '0 0 0 3px rgba(220,90,60,0.2), 0 6px 28px rgba(220,90,60,0.25)'
          : isInterrupted
          ? '0 0 0 3px rgba(220,38,38,0.2)'
          : undefined,
      }}
      role="region"
      aria-label="Voice state visualizer"
    >
      {/* Background ambient aura */}
      <motion.div
        className="absolute inset-0 pointer-events-none rounded-2xl"
        animate={{ opacity: isSpeaking ? [0.18, 0.35, 0.18] : [0.08, 0.14, 0.08] }}
        transition={{ duration: isSpeaking ? 0.9 : 2.5, repeat: Infinity, ease: 'easeInOut' }}
        style={{ background: `radial-gradient(ellipse at center, ${meta.glowColor} 0%, transparent 70%)` }}
      />

      {/* TOP HEADER: STATUS BADGE OR RIME TTS LIVE BANNER */}
      <div className="w-full z-10">
        <AnimatePresence mode="wait">
          {isSpeaking ? (
            <motion.div
              key="rime-banner"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="w-full px-3 py-1.5 rounded-xl flex items-center justify-between gap-2"
              style={{
                background: 'linear-gradient(135deg, rgba(220,90,60,0.18) 0%, rgba(220,90,60,0.08) 100%)',
                border: '1.5px solid rgba(220,90,60,0.55)',
              }}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: 'var(--color-terracotta)' }} />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ backgroundColor: 'var(--color-terracotta)' }} />
                </span>
                <span className="text-[11px] font-extrabold tracking-wider uppercase text-kitchen-terracotta truncate">
                  {language === 'te'
                    ? 'Telugu Voice Live'
                    : language === 'hi'
                    ? 'Hindi Voice Live'
                    : 'Rime TTS Live'}
                </span>
              </div>
              <div className="flex items-end gap-[3px] h-4 flex-shrink-0">
                {[0.45, 0.9, 0.6, 1, 0.7, 0.85, 0.5].map((h, i) => (
                  <motion.div
                    key={i}
                    className="w-[2.5px] rounded-full"
                    style={{ backgroundColor: 'var(--color-terracotta)', transformOrigin: 'bottom', height: `${Math.round(h * 16)}px` }}
                    animate={{ scaleY: [h, h * 0.35, h, h * 0.65, h] }}
                    transition={{ duration: 0.65 + i * 0.07, repeat: Infinity, ease: 'easeInOut', delay: i * 0.06 }}
                  />
                ))}
              </div>
            </motion.div>
          ) : (
            <div className="flex justify-center">
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-extrabold uppercase tracking-wider text-[11px]"
                style={{
                  backgroundColor: `${meta.color}22`,
                  color: meta.color,
                  border: `1.5px solid ${meta.color}66`,
                }}
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: meta.color }}
                />
                {meta.statusText}
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* CENTER ORB: FULLY UNCLIPPED WITH DEDICATED HEIGHT */}
      <div className="relative flex items-center justify-center w-full my-3 min-h-[96px]">
        {/* Expanding concentric ripple rings */}
        <AnimatePresence>
          {isSpeaking && [1, 2, 3].map((ring) => (
            <motion.div
              key={`sr-${ring}`}
              className="absolute rounded-full border-2 pointer-events-none"
              style={{
                width: '84px',
                height: '84px',
                borderColor: 'var(--color-terracotta)',
              }}
              initial={{ scale: 0.9, opacity: 0.8 }}
              animate={{ scale: 1.35 + ring * 0.22, opacity: 0 }}
              transition={{ duration: 1.5, repeat: Infinity, delay: ring * 0.3, ease: 'easeOut' }}
            />
          ))}
          {isUserSpeaking && (
            <motion.div
              className="absolute w-[84px] h-[84px] rounded-full border-2 border-kitchen-amber pointer-events-none"
              animate={{ scale: 1 + Math.min(0.4, micLevel / 80), opacity: [0.6, 0.2] }}
              transition={{ duration: 0.2 }}
            />
          )}
          {isThinking && (
            <motion.div
              className="absolute w-[94px] h-[94px] rounded-full border-2 border-dashed border-kitchen-amber pointer-events-none"
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            />
          )}
          {isInterrupted && (
            <motion.div
              className="absolute w-[98px] h-[98px] rounded-full border-4 border-kitchen-crimson pointer-events-none"
              initial={{ scale: 1.25, opacity: 1 }}
              animate={{ scale: 1, opacity: [1, 0.4, 1] }}
              transition={{ duration: 0.35 }}
            />
          )}
        </AnimatePresence>

        {/* The Core Orb Button / Visualizer */}
        <motion.div
          className="relative flex items-center justify-center w-[80px] h-[80px] rounded-full shadow-kitchen-blue-glow z-10"
          style={{ backgroundColor: meta.color }}
          animate={{
            scale: isSpeaking
              ? [1, 1.08, 0.98, 1.05, 1]
              : isInterrupted
              ? [1.18, 0.96, 1.04, 1]
              : isUserSpeaking
              ? 1 + Math.min(0.2, micLevel / 100)
              : [1, 1.03, 1],
          }}
          transition={{
            duration: isSpeaking ? 0.85 : isInterrupted ? 0.4 : 2,
            repeat: isInterrupted ? 0 : Infinity,
            ease: 'easeInOut',
          }}
        >
          {meta.icon}
        </motion.div>
      </div>

      {/* BOTTOM HINTS & TITLES */}
      <div className="text-center z-10 w-full mt-1">
        <h2 className="font-extrabold tracking-tight text-kitchen-text-primary text-base leading-tight">
          {meta.title}
        </h2>
        <p className="text-xs font-medium text-kitchen-text-muted mt-0.5 leading-snug">
          {meta.subtitle}
        </p>
      </div>
    </motion.div>
  );
};
