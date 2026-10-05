import React, { useState, useEffect, useRef } from 'react';
import { VoiceState } from '../../types';
import { Mic, Square, X, Sparkles, Loader2 } from 'lucide-react';

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
  const [state, setState] = useState<VoiceState>('IDLE');
  const [transcript, setTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [waveformBars, setWaveformBars] = useState<number[]>([35, 55, 30, 75, 90, 45, 70, 30]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const presets = [
    'Find me wireless earbuds under ₹2,800 from Amazon, Flipkart, and Store Owners.',
    'Negotiate the Sony WF-C700N Earbuds down to ₹2,200.',
    'Show me Levi’s casual shirts for college under ₹2,000.',
    'Compare Nike and Puma sneakers under ₹3,000.',
  ];

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setWaveformBars(
        Array.from({ length: 12 }, () =>
          isRecording ? Math.floor(Math.random() * 75) + 20 : 25
        )
      );
    }, 120);
    return () => clearInterval(interval);
  }, [isOpen, isRecording]);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  if (!isOpen) return null;

  const startRecording = async () => {
    setErrorMsg(null);
    setTranscript('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setIsRecording(false);
        const audioBlob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        });
        await transcribeAudioBlob(audioBlob, recorder.mimeType || 'audio/webm');
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setState('LISTENING');
    } catch (err: any) {
      setErrorMsg(
        'Microphone permission could not be accessed. You can click any voice preset below or grant mic permission.'
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const transcribeAudioBlob = async (blob: Blob, mimeType: string) => {
    setIsTranscribing(true);
    setState('UNDERSTANDING');
    try {
      const base64Audio = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const res = reader.result as string;
          const base64 = res.split(',')[1] || '';
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const response = await fetch('/api/gemini/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64: base64Audio,
          mimeType,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Transcription failed.');
      }
      if (data.transcript) {
        setTranscript(data.transcript);
      } else {
        setErrorMsg('No speech detected. Please try speaking again.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to transcribe audio with gemini-3.5-transcribe.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleExecute = (textToUse: string) => {
    setState('UNDERSTANDING');
    setTimeout(() => {
      onVoiceCommand(textToUse);
      onClose();
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl border border-cyan-500/30 bg-gradient-to-b from-[#0E1524] via-[#0A0F1A] to-[#070A10] p-6 shadow-2xl shadow-cyan-950/60 text-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Agent Status */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
          <span className="font-mono text-xs uppercase text-cyan-300 font-bold tracking-wider">
            Gemini 3.5 Audio Transcription Agent
          </span>
        </div>

        <h3 className="font-display font-bold text-xl text-white mb-1">
          {isRecording
            ? 'Recording your microphone...'
            : isTranscribing
            ? 'Transcribing with gemini-3.5-transcribe...'
            : 'Speak Your Shopping & Negotiation Goal'}
        </h3>
        <p className="text-xs text-slate-400 mb-5">
          Record audio with your microphone and our server-side Gemini 3.5 Transcribe model will convert it into an AI shopping search.
        </p>

        {/* Record / Stop Microphone Button */}
        <div className="flex items-center justify-center mb-5">
          {!isRecording ? (
            <button
              type="button"
              onClick={startRecording}
              disabled={isTranscribing}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/30 cursor-pointer hover:scale-105 transition-transform"
            >
              <Mic className="w-4 h-4" />
              <span>Start Microphone Recording</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={stopRecording}
              className="px-6 py-3 rounded-2xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-rose-500/30 cursor-pointer animate-pulse"
            >
              <Square className="w-4 h-4 fill-current" />
              <span>Stop & Transcribe Audio</span>
            </button>
          )}
        </div>

        {/* Dynamic Waveform Visualizer */}
        <div className="py-5 flex items-center justify-center gap-2 h-20 mb-5 px-4 bg-slate-950/60 rounded-2xl border border-slate-800">
          {waveformBars.map((height, idx) => (
            <div
              key={idx}
              className="w-2.5 rounded-full bg-gradient-to-t from-cyan-500 via-indigo-400 to-teal-300 transition-all duration-100"
              style={{ height: `${height}%` }}
            />
          ))}
        </div>

        {errorMsg && (
          <div className="mb-4 p-2.5 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-200 text-xs">
            {errorMsg}
          </div>
        )}

        {/* Live Transcript Box */}
        <div className="mb-5 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 min-h-[54px] flex items-center justify-center">
          {isTranscribing ? (
            <div className="flex items-center gap-2 text-cyan-300 text-xs font-mono">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Transcribing audio via gemini-3.5-transcribe...</span>
            </div>
          ) : (
            <p className="text-sm font-medium text-slate-200 italic">
              {transcript
                ? `"${transcript}"`
                : 'Click "Start Microphone Recording" above or choose a quick voice command below.'}
            </p>
          )}
        </div>

        {/* Preset Voice Prompts */}
        <div className="text-left mb-5">
          <div className="text-[10px] uppercase font-mono text-slate-400 mb-2">
            Quick Voice Instructions:
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

        {/* Execute Transcribed Audio */}
        {transcript && (
          <button
            onClick={() => handleExecute(transcript)}
            className="w-full py-3 bg-gradient-to-r from-cyan-400 to-indigo-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/30 cursor-pointer"
          >
            Search & Negotiate with Transcribed Audio
          </button>
        )}
      </div>
    </div>
  );
};
