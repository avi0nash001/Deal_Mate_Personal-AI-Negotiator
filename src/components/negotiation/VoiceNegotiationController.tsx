import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  Check,
  AlertCircle,
  TrendingDown,
  Wallet,
} from 'lucide-react';
import {
  parseVoiceNegotiationCommand,
  speakVoiceFeedback,
} from '../../services/voiceNegotiationService';

interface VoiceNegotiationControllerProps {
  currentTargetPrice: number;
  currentMaxBudget: number;
  floorPrice?: number;
  productName?: string;
  onUpdateTargetPrice: (newTarget: number) => void;
  onUpdateMaxBudget: (newBudget: number) => void;
  disabled?: boolean;
  compact?: boolean;
}

export const VoiceNegotiationController: React.FC<VoiceNegotiationControllerProps> = ({
  currentTargetPrice,
  currentMaxBudget,
  floorPrice,
  productName,
  onUpdateTargetPrice,
  onUpdateMaxBudget,
  disabled = false,
  compact = false,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [lastActionFeedback, setLastActionFeedback] = useState<{
    text: string;
    type: 'target' | 'budget';
  } | null>(null);
  const recognitionRef = useRef<any>(null);

  // Clear feedback badge after 5 seconds
  useEffect(() => {
    if (lastActionFeedback) {
      const timer = setTimeout(() => {
        setLastActionFeedback(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [lastActionFeedback]);

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
    setInterimTranscript('');
  };

  const startListening = () => {
    if (disabled) return;

    const SpeechRecognitionAPI =
      typeof window !== 'undefined'
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : null;

    if (!SpeechRecognitionAPI) {
      alert('Speech Recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    try {
      const recognition = new SpeechRecognitionAPI();
      recognition.lang = 'en-IN';
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.continuous = false;

      recognition.onstart = () => {
        setIsListening(true);
        setInterimTranscript('Listening...');
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const chunk = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += chunk;
          } else {
            interim += chunk;
          }
        }

        if (interim) {
          setInterimTranscript(interim);
        }

        if (finalTranscript.trim()) {
          setInterimTranscript(finalTranscript.trim());
          const parsed = parseVoiceNegotiationCommand(finalTranscript);

          if (parsed.type === 'TARGET_PRICE' && parsed.amount) {
            const amount = parsed.amount;
            onUpdateTargetPrice(amount);
            setLastActionFeedback({
              text: `Target price updated to ₹${amount.toLocaleString('en-IN')}`,
              type: 'target',
            });
            speakVoiceFeedback(`Target price set to ${amount} rupees. Updating counter offer.`);
          } else if (parsed.type === 'MAX_BUDGET' && parsed.amount) {
            const amount = parsed.amount;
            onUpdateMaxBudget(amount);
            setLastActionFeedback({
              text: `Max budget updated to ₹${amount.toLocaleString('en-IN')}`,
              type: 'budget',
            });
            speakVoiceFeedback(`Max budget updated to ${amount} rupees.`);
          } else {
            setLastActionFeedback({
              text: `Heard "${finalTranscript.trim()}". Try: "Target ₹1,800" or "Budget ₹2,500"`,
              type: 'target',
            });
          }

          setTimeout(() => {
            stopListening();
          }, 400);
        }
      };

      recognition.onerror = () => {
        stopListening();
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const handleToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Quick preset trigger for convenience
  const handleQuickPreset = (type: 'target' | 'budget', delta: number) => {
    if (type === 'target') {
      const newTarget = Math.max(floorPrice || 500, currentTargetPrice + delta);
      onUpdateTargetPrice(newTarget);
      setLastActionFeedback({
        text: `Target set to ₹${newTarget.toLocaleString('en-IN')}`,
        type: 'target',
      });
      speakVoiceFeedback(`Target updated to ${newTarget} rupees.`);
    } else {
      const newBudget = Math.max(500, currentMaxBudget + delta);
      onUpdateMaxBudget(newBudget);
      setLastActionFeedback({
        text: `Budget set to ₹${newBudget.toLocaleString('en-IN')}`,
        type: 'budget',
      });
      speakVoiceFeedback(`Budget updated to ${newBudget} rupees.`);
    }
  };

  return (
    <div
      className={`rounded-2xl border transition-all ${
        isListening
          ? 'bg-cyan-950/40 border-cyan-500 shadow-lg shadow-cyan-950/50'
          : 'bg-[#0B0F19] border-slate-800'
      } ${compact ? 'p-2.5' : 'p-3.5'} space-y-2.5`}
    >
      {/* Header & Main Toggle */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggle}
            disabled={disabled}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              isListening
                ? 'bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/40 scale-105'
                : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/40'
            }`}
            title={isListening ? 'Stop listening' : 'Start voice command'}
          >
            {isListening ? (
              <MicOff className="w-4 h-4 text-white" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </button>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-display font-bold text-white flex items-center gap-1">
                <span>Voice Command Assistant</span>
                {isListening && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block" />
                )}
              </span>
            </div>
            <p className="text-[11px] font-mono text-slate-400">
              {isListening ? (
                <span className="text-cyan-300 font-semibold animate-pulse">
                  {interimTranscript || 'Listening for target price or budget...'}
                </span>
              ) : (
                'Verbally update target price or max budget'
              )}
            </p>
          </div>
        </div>

        {/* Live Audio Visualizer waves when listening */}
        {isListening && (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-950/60 border border-rose-800/60 text-rose-300 text-[10px] font-mono">
            <span className="w-1 h-3 bg-rose-400 animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1 h-4 bg-rose-400 animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1 h-2 bg-rose-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            <span className="ml-1 font-bold">SPEAK NOW</span>
          </div>
        )}
      </div>

      {/* Verbal Command Hints */}
      <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono text-slate-400">
        <span className="text-slate-500 text-[10px] uppercase">Say:</span>
        <button
          type="button"
          onClick={() => handleQuickPreset('target', -100)}
          className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/50 hover:text-cyan-300 transition-colors cursor-pointer flex items-center gap-1"
        >
          <TrendingDown className="w-3 h-3 text-cyan-400" />
          <span>"Target ₹{(currentTargetPrice - 100).toLocaleString('en-IN')}"</span>
        </button>
        <button
          type="button"
          onClick={() => handleQuickPreset('budget', 500)}
          className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-amber-500/50 hover:text-amber-300 transition-colors cursor-pointer flex items-center gap-1"
        >
          <Wallet className="w-3 h-3 text-amber-400" />
          <span>"Budget ₹{(currentMaxBudget + 500).toLocaleString('en-IN')}"</span>
        </button>
      </div>

      {/* Confirmation feedback banner */}
      {lastActionFeedback && (
        <div
          className={`px-3 py-1.5 rounded-xl border text-xs font-mono flex items-center gap-2 animate-in fade-in duration-200 ${
            lastActionFeedback.type === 'target'
              ? 'bg-cyan-950/40 border-cyan-700/60 text-cyan-300'
              : 'bg-amber-950/40 border-amber-700/60 text-amber-300'
          }`}
        >
          <Check className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
          <span className="truncate">{lastActionFeedback.text}</span>
        </div>
      )}
    </div>
  );
};
