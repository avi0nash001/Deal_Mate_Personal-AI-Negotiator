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
  RotateCcw,
  X,
  Square,
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
  isLight?: boolean;
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
  isLight = false,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [lastActionFeedback, setLastActionFeedback] = useState<{
    text: string;
    type: 'target' | 'budget' | 'unrecognized';
  } | null>(null);
  const recognitionRef = useRef<any>(null);

  // Clear feedback badge after 6 seconds
  useEffect(() => {
    if (lastActionFeedback) {
      const timer = setTimeout(() => {
        setLastActionFeedback(null);
      }, 6000);
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
        setLastActionFeedback(null);
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
              type: 'unrecognized',
            });
          }

          setTimeout(() => {
            stopListening();
          }, 400);
        }
      };

      recognition.onerror = () => {
        stopListening();
        setLastActionFeedback({
          text: 'Microphone input ended or had an error. Tap retry to speak again.',
          type: 'unrecognized',
        });
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
          ? 'bg-gradient-to-r from-[#0C233F] via-[#0E1F38] to-[#0A1A2F] border-cyan-400 shadow-xl shadow-cyan-950/60 ring-1 ring-cyan-400/40'
          : isLight
          ? 'bg-slate-100 border-slate-300 shadow-sm'
          : 'bg-[#0E172A] border-slate-700/90 shadow-md'
      } ${compact ? 'p-3 space-y-2.5' : 'p-3.5 sm:p-4 space-y-3'}`}
    >
      {/* Header & Main Toggle */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleToggle}
            disabled={disabled}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-400 ${
              isListening
                ? 'bg-rose-500 hover:bg-rose-600 text-white animate-pulse shadow-lg shadow-rose-500/50 scale-105 border border-rose-400 ring-2 ring-rose-400/40'
                : 'bg-cyan-500/20 hover:bg-cyan-500/35 text-cyan-300 border border-cyan-400/60 hover:border-cyan-300 shadow-sm'
            }`}
            title={isListening ? 'Stop listening' : 'Start voice command'}
            aria-label={isListening ? 'Stop listening' : 'Start voice command'}
          >
            {isListening ? (
              <MicOff className="w-5 h-5 text-white" />
            ) : (
              <Mic className="w-5 h-5 text-cyan-300" />
            )}
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs sm:text-sm font-display font-bold tracking-wide flex items-center gap-1.5 ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}
              >
                <span>Voice Command Assistant</span>
                {isListening && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block" />
                )}
              </span>
            </div>
            <p className="text-xs font-mono text-slate-300 font-medium mt-0.5">
              {isListening ? (
                <span className="text-cyan-300 font-semibold animate-pulse flex items-center gap-1">
                  <span>Listening... Speak target price or max budget</span>
                </span>
              ) : (
                'Verbally update target price or max budget'
              )}
            </p>
          </div>
        </div>

        {/* Live Audio Visualizer waves when listening */}
        {isListening ? (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-950/90 border border-rose-600 text-rose-200 text-xs font-mono font-bold shadow-md shadow-rose-950/60">
            <span className="w-1.5 h-3.5 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-5 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-3 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            <span className="ml-1 tracking-wider">SPEAK NOW</span>
            <button
              type="button"
              onClick={stopListening}
              className="ml-1 p-0.5 rounded hover:bg-rose-900 text-rose-200 cursor-pointer"
              title="Stop Recording"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={startListening}
            disabled={disabled}
            className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/60 text-cyan-300 text-xs font-mono font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Start Listening</span>
          </button>
        )}
      </div>

      {/* Live Interim Transcript Display */}
      {isListening && interimTranscript && (
        <div className="px-3 py-2 rounded-xl bg-[#08101E] border border-cyan-500/60 text-xs font-mono text-cyan-200 flex items-center gap-2 shadow-inner">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping shrink-0" />
          <span className="text-cyan-400 font-bold">Heard:</span>
          <span className="italic truncate">&ldquo;{interimTranscript}&rdquo;</span>
        </div>
      )}

      {/* Verbal Command Hints */}
      <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-200 pt-1 border-t border-slate-700/80">
        <span className="text-slate-300 text-[10px] uppercase font-bold tracking-wider">
          Quick Voice Actions:
        </span>
        <button
          type="button"
          onClick={() => handleQuickPreset('target', -100)}
          className="px-2.5 py-1 rounded-xl bg-[#141F36] hover:bg-[#1B2B4A] active:bg-[#111A2D] border border-slate-700 hover:border-cyan-400 text-slate-200 hover:text-cyan-200 text-xs font-mono font-medium shadow-xs transition-all flex items-center gap-1.5 cursor-pointer focus:outline-none focus:ring-1 focus:ring-cyan-400"
        >
          <TrendingDown className="w-3.5 h-3.5 text-cyan-400" />
          <span>"Target ₹{(currentTargetPrice - 100).toLocaleString('en-IN')}"</span>
        </button>
        <button
          type="button"
          onClick={() => handleQuickPreset('budget', 500)}
          className="px-2.5 py-1 rounded-xl bg-[#141F36] hover:bg-[#1B2B4A] active:bg-[#111A2D] border border-slate-700 hover:border-amber-400 text-slate-200 hover:text-amber-200 text-xs font-mono font-medium shadow-xs transition-all flex items-center gap-1.5 cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber-400"
        >
          <Wallet className="w-3.5 h-3.5 text-amber-400" />
          <span>"Budget ₹{(currentMaxBudget + 500).toLocaleString('en-IN')}"</span>
        </button>
      </div>

      {/* Confirmation feedback banner */}
      {lastActionFeedback && (
        <div
          className={`px-3 py-2 rounded-xl border text-xs font-mono flex items-center justify-between gap-2 shadow-md animate-in fade-in duration-200 ${
            lastActionFeedback.type === 'target'
              ? 'bg-cyan-950/80 border-cyan-500/80 text-cyan-200'
              : lastActionFeedback.type === 'budget'
              ? 'bg-amber-950/80 border-amber-500/80 text-amber-200'
              : 'bg-slate-900 border-slate-600 text-slate-200'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            {lastActionFeedback.type === 'unrecognized' ? (
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
            ) : (
              <Check className="w-4 h-4 shrink-0 text-emerald-400" />
            )}
            <span className="truncate font-medium">{lastActionFeedback.text}</span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {lastActionFeedback.type === 'unrecognized' && (
              <button
                type="button"
                onClick={startListening}
                className="px-2 py-0.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Retry</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setLastActionFeedback(null)}
              className="p-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white cursor-pointer"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
