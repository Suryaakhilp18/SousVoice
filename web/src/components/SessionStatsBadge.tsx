import React from 'react';
import type { SessionStats } from '../types';
import { Clock, MessageSquare, Zap } from 'lucide-react';

interface SessionStatsBadgeProps {
  stats: SessionStats;
}

export const SessionStatsBadge: React.FC<SessionStatsBadgeProps> = ({ stats }) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div
      className="grid grid-cols-3 gap-1.5 p-2 bg-kitchen-surface border border-kitchen-border rounded-xl shadow-kitchen-sm"
      aria-label="Cooking session statistics"
    >
      <div className="flex flex-col items-center justify-center p-1.5 bg-kitchen-elevated rounded-lg">
        <div className="flex items-center gap-1 text-kitchen-amber">
          <Clock className="w-3.5 h-3.5" />
          <span className="text-xs font-bold font-mono text-kitchen-text-primary">
            {formatTime(stats.durationSeconds)}
          </span>
        </div>
        <span className="text-[10px] text-kitchen-text-muted font-medium mt-0.5">Duration</span>
      </div>

      <div className="flex flex-col items-center justify-center p-1.5 bg-kitchen-elevated rounded-lg">
        <div className="flex items-center gap-1 text-kitchen-cyan">
          <MessageSquare className="w-3.5 h-3.5" />
          <span className="text-xs font-bold font-mono text-kitchen-text-primary">
            {stats.turnsCount}
          </span>
        </div>
        <span className="text-[10px] text-kitchen-text-muted font-medium mt-0.5">Turns</span>
      </div>

      <div className="flex flex-col items-center justify-center p-1.5 bg-kitchen-elevated rounded-lg">
        <div className="flex items-center gap-1 text-kitchen-crimson">
          <Zap className="w-3.5 h-3.5 fill-current" />
          <span className="text-xs font-bold font-mono text-kitchen-text-primary">
            {stats.interruptedCount}
          </span>
        </div>
        <span className="text-[10px] text-kitchen-text-muted font-medium mt-0.5">Barge-ins</span>
      </div>
    </div>
  );
};
