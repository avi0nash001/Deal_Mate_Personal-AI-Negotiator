import React, { useState, useEffect } from 'react';
import { VoiceState } from '../../types';
import { Mic, MicOff, X, Sparkles, Volume2, Bot } from 'lucide-react';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVoiceCommand: (transcript: string) => void;
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  isOpen,
  onClose,
  onVoiceCommand,
}) => {
  const [state, setState] = useState<VoiceState>('LISTENING');
  const [transcript, setTranscript] = useState('');
  const [waveformBars, setWaveformBars] = useState<number[]>([40, 65, 30, 85, 95, 45, 70, 30]);

  // Voice presets for immediate testing
  const presets = [
    "Find me wireless earbuds under ₹2,600 and negotiate as low as possible.",
    "Negotiate the Titan Titanium Smartwatch targeting ₹3,600.",
    "Compare verified sellers for Studio Pro Headphones.",
    "Bundle earbuds and smartwatch under ₹6,300.",
  ];

  // Animated waveform simulation
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setWaveformBars(
        Array.from({ length: 12 }, () => Math.floor(Math.random() * 70) + 20)
      );
    }, 120);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Web Speech API attempt
  useEffect(() => {
    if (!isOpen) return;
    setState('LISTENING');
    setTranscript('');

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-IN';

        recognition.onresult = (event: any) => {
          const current = event.resultIndex;
          const text = event.results[current][0].transcript;
          setTranscript(text);
        };

        recognition.onspeechend = () => {
          setState('UNDERSTANDING');
        };

        recognition.start();

        return () => {
          recognition.abort();
        };
      } catch (err) {
        // Fallback to simulated input
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleExecute = (textToUse: string) => {
    setState('UNDERSTANDING');
    setTimeout(() => {
      onVoiceCommand(textToUse);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl border border-cyan-500/30 bg-gradient-to-b from-[#0E1524] via-[#0A0F1A] to-[#070A10] p-6 shadow-2xl shadow-cyan-950/60 text-center transform-style-3d">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Agent Status */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
          <span className="font-mono text-xs uppercase text-cyan-300 font-bold tracking-wider">
            Voice AI Commerce Agent
          </span>
        </div>

        <h3 className="font-display font-bold text-xl text-white mb-2">
          {state === 'LISTENING' && 'Listening to your request...'}
          {state === 'UNDERSTANDING' && 'Interpreting budget & target constraints...'}
          {state === 'NEGOTIATING' && 'Communicating with seller...'}
        </h3>
        <p className="text-xs text-slate-400 mb-6">
          Speak your desired product, target price, or ceiling budget in natural language.
        </p>

        {/* Dynamic 3D Waveform Visualizer */}
        <div className="py-6 flex items-center justify-center gap-2 h-24 mb-6 px-4 bg-slate-950/60 rounded-2xl border border-slate-800">
          {waveformBars.map((height, idx) => (
            <div
              key={idx}
              className="w-2.5 rounded-full bg-gradient-to-t from-cyan-500 via-indigo-400 to-teal-300 transition-all duration-100 shadow-sm shadow-cyan-500/40"
              style={{ height: `${height}%` }}
            />
          ))}
        </div>

        {/* Live Transcript Box */}
        <div className="mb-6 p-3 rounded-xl bg-slate-900/80 border border-slate-800 min-h-[52px] flex items-center justify-center">
          <p className="text-sm font-medium text-slate-200 italic">
            {transcript ? `"${transcript}"` : 'Listening... speak or select a quick voice prompt below.'}
          </p>
        </div>

        {/* Preset Voice Prompts for reliable 1-click test */}
        <div className="text-left mb-6">
          <div className="text-[10px] uppercase font-mono text-slate-400 mb-2">
            Suggested Voice Instructions:
          </div>
          <div className="space-y-1.5">
            {presets.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => handleExecute(preset)}
                className="w-full text-left px-3 py-2 rounded-lg bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 hover:text-cyan-300 transition-colors flex items-center justify-between group cursor-pointer"
              >
                <span className="truncate">{preset}</span>
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 opacity-60 group-hover:opacity-100 shrink-0 ml-2" />
              </button>
            ))}
          </div>
        </div>

        {/* Action Button */}
        {transcript && (
          <button
            onClick={() => handleExecute(transcript)}
            className="w-full py-3 bg-gradient-to-r from-cyan-400 to-indigo-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/30 cursor-pointer"
          >
            Execute Instruction
          </button>
        )}
      </div>
    </div>
  );
};
