import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TranscriptMessage } from '../types';
import { ArrowDown, Bot, Clock, RotateCcw, User, ZapOff } from 'lucide-react';
import { handleCookMessage } from '../services/mockSession';

interface LiveTranscriptProps {
  transcript: TranscriptMessage[];
  className?: string;
  footer?: React.ReactNode;
}

export const LiveTranscript: React.FC<LiveTranscriptProps> = ({
  transcript,
  className = '',
  footer,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [userHasScrolledUp, setUserHasScrolledUp] = useState(false);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    // If the user has scrolled more than 80px away from the bottom:
    const isAtBottom = scrollHeight - (scrollTop + clientHeight) < 80;
    setUserHasScrolledUp(!isAtBottom);
  };

  const scrollToBottom = (smooth = true) => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
      setUserHasScrolledUp(false);
    }
  };

  // Only auto-scroll to the bottom when new messages arrive IF user is not inspecting past history
  useEffect(() => {
    if (!userHasScrolledUp) {
      scrollToBottom(true);
    }
  }, [transcript, userHasScrolledUp]);

  const handleReaskQuestion = (text: string) => {
    handleCookMessage(text);
  };

  return (
    <div
      className={`relative flex flex-col bg-kitchen-surface border-2 border-kitchen-border rounded-2xl shadow-kitchen overflow-hidden ${className}`}
      aria-label="Live Voice Transcript"
    >
      <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-kitchen-border bg-kitchen-elevated/40 shrink-0">
        <span className="text-xs font-bold uppercase tracking-wider text-kitchen-amber">
          Live Conversation Transcript
        </span>
        <span className="text-xs font-medium text-kitchen-text-muted">
          {transcript.length} {transcript.length === 1 ? 'turn' : 'turns'}
        </span>
      </div>

      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 flex flex-col gap-3.5 overscroll-contain"
        role="log"
        aria-live="polite"
        aria-relevant="additions"
      >
        {transcript.length === 0 ? (
          <div className="flex items-center justify-center h-full min-h-[14rem] text-kitchen-text-muted text-sm sm:text-base italic text-center px-4">
            SousVoice is listening hands-free. Ask about substitutions, quantities, or cooking steps.
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {transcript.map((msg, index) => {
              const isCook = msg.speaker === 'cook';
              const isInterrupted = msg.interrupted;
              const isQueued = msg.queued;
              const prevMsg = transcript[index - 1];
              const isConsecutiveAgent = !isCook && prevMsg && prevMsg.speaker === 'agent';

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                  className={`flex flex-col max-w-[94%] sm:max-w-[88%] rounded-2xl p-3.5 leading-relaxed text-sm sm:text-base transition-all ${
                    isCook
                      ? isQueued
                        ? 'ml-auto bg-kitchen-elevated/70 border border-kitchen-border/80 opacity-75 text-kitchen-text-secondary'
                        : 'ml-auto bg-kitchen-active border border-kitchen-border-strong text-kitchen-text-primary'
                      : isInterrupted
                      ? 'mr-auto bg-kitchen-crimson/10 border-2 border-kitchen-crimson/60 opacity-80'
                      : isConsecutiveAgent
                      ? 'mr-auto bg-kitchen-elevated/90 border border-kitchen-border -mt-1.5'
                      : 'mr-auto bg-kitchen-elevated border border-kitchen-border text-kitchen-text-primary'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span
                      className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                        isCook
                          ? 'text-kitchen-cyan'
                          : isInterrupted
                          ? 'text-kitchen-crimson'
                          : 'text-kitchen-amber'
                      }`}
                    >
                      {isCook ? (
                        <>
                          <User className="w-3.5 h-3.5" />
                          <span>Cook</span>
                        </>
                      ) : (
                        <>
                          <Bot className="w-3.5 h-3.5" />
                          <span>SousVoice</span>
                        </>
                      )}
                    </span>

                    {/* Queued badge for upcoming follow-up */}
                    {isQueued && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-kitchen-border text-kitchen-text-muted text-[10px] font-mono font-bold tracking-tight uppercase">
                        <Clock className="w-3 h-3" />
                        Queued Next
                      </span>
                    )}

                    {/* Informative Interruption Badge with Distinct Reason */}
                    {isInterrupted && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-kitchen-crimson/20 text-kitchen-crimson text-[10px] font-mono font-bold tracking-tight uppercase">
                        <ZapOff className="w-3 h-3" />
                        {msg.interruptedReason === 'explicit-stop'
                          ? 'You said wait'
                          : 'Cut off (Barge-in)'}
                      </span>
                    )}
                  </div>

                  <p
                    className={`whitespace-pre-line ${
                      isInterrupted
                        ? 'line-through text-kitchen-text-muted italic'
                        : 'text-kitchen-text-primary'
                    }`}
                  >
                    {msg.text}
                  </p>

                  {/* Re-ask Affordance for Struck-Through Utterances */}
                  {isInterrupted && (
                    <button
                      type="button"
                      onClick={() => handleReaskQuestion(msg.text)}
                      className="inline-flex items-center gap-1.5 self-start mt-2 px-2.5 py-1 rounded-lg bg-kitchen-surface border border-kitchen-border hover:border-kitchen-amber text-[11px] font-bold text-kitchen-text-muted hover:text-kitchen-text-primary transition-all active:scale-95"
                    >
                      <RotateCcw className="w-3 h-3 text-kitchen-amber" />
                      <span>Ask this again</span>
                    </button>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Floating Jump to Latest Button when inspecting earlier messages */}
      <AnimatePresence>
        {userHasScrolledUp && (
          <motion.button
            type="button"
            initial={{ opacity: 0, y: 12, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.9 }}
            onClick={() => scrollToBottom(true)}
            className="absolute bottom-20 right-6 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-kitchen-amber text-slate-950 font-bold text-xs shadow-kitchen-blue-glow hover:brightness-110 active:scale-95 transition-all"
          >
            <ArrowDown className="w-3.5 h-3.5" />
            <span>Jump to latest</span>
          </motion.button>
        )}
      </AnimatePresence>

      {footer && (
        <div className="border-t border-kitchen-border bg-kitchen-elevated/30 p-3 sm:p-4 shrink-0">
          {footer}
        </div>
      )}
    </div>
  );
};

