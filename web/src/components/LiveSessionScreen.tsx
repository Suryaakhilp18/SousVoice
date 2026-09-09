import React, { useEffect } from 'react';
import { useSousVoiceStore } from '../store/useSousVoiceStore';
import { RecipeContextPanel } from './RecipeContextPanel';
import { VoiceOrbVisualizer } from './VoiceOrbVisualizer';
import { RecipeProgressRail } from './RecipeProgressRail';
import { LiveTranscript } from './LiveTranscript';
import { SessionStatsBadge } from './SessionStatsBadge';
import { KitchenControlBar } from './KitchenControlBar';
import { handleCookMessage, endMockSession } from '../services/mockSession';
import { stopMicrophone } from '../services/speechService';

export const LiveSessionScreen: React.FC = () => {
  const {
    voiceState,
    micLevel,
    transcript,
    currentStep,
    completedSteps,
    stats,
    isMuted,
    setCurrentStep,
    toggleMute,
  } = useSousVoiceStore();

  // Ensure microphone tracks and sound analysis are completely released on unmount
  useEffect(() => {
    return () => {
      stopMicrophone();
      useSousVoiceStore.getState().setMicLevel(0);
    };
  }, []);

  const handleEndSession = () => {
    endMockSession();
  };

  const handleSimulateCook = (text: string) => {
    handleCookMessage(text);
  };

  const handleSelectStep = (stepNum: number) => {
    setCurrentStep(stepNum);
    handleCookMessage(`Go to step ${stepNum}`);
  };

  return (
    <div className="flex-1 w-full max-w-6xl mx-auto py-1.5 grid grid-cols-1 lg:grid-cols-[minmax(0,340px)_1fr] gap-4 lg:h-[calc(100dvh-8.5rem)] lg:max-h-[calc(100dvh-8.5rem)] min-h-[560px] lg:overflow-hidden">
      {/* Left column: status — independently scrollable on smaller heights, never compresses the voice card */}
      <div className="flex flex-col gap-2.5 lg:overflow-y-auto lg:overflow-x-hidden lg:min-h-0 pr-1 pb-2">
        <RecipeContextPanel onSelectStep={handleSelectStep} />
        <VoiceOrbVisualizer state={voiceState} micLevel={micLevel} />
        <SessionStatsBadge stats={stats} />
        <RecipeProgressRail
          currentStep={currentStep}
          completedSteps={completedSteps}
          onSelectStep={handleSelectStep}
        />
      </div>

      {/* Right column: transcript grows to fill, only inner message area scrolls */}
      <div className="flex flex-col min-h-[500px] lg:h-full lg:min-h-0 lg:overflow-hidden">
        <LiveTranscript
          transcript={transcript}
          className="flex-1 min-h-0 h-full"
          footer={
            <KitchenControlBar
              isMuted={isMuted}
              isMockMode={true}
              onToggleMute={toggleMute}
              onEndSession={handleEndSession}
              onSimulateCook={handleSimulateCook}
            />
          }
        />
      </div>
    </div>
  );
};
