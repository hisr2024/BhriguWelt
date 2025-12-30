"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import Tooltip from "@/components/Tooltip";

type VoiceInputButtonProps = {
  onTranscript: (value: string) => void;
  disabled?: boolean;
};

type SpeechRecognitionType = typeof window extends { webkitSpeechRecognition: infer T }
  ? T
  : typeof window extends { SpeechRecognition: infer U }
  ? U
  : any;

export default function VoiceInputButton({ onTranscript, disabled }: VoiceInputButtonProps) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionType | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    setSupported(true);
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognitionRef.current = recognition;
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results?.[0]?.[0]?.transcript;
      if (transcript) onTranscript(transcript);
    };
    recognition.onend = () => {
      setListening(false);
    };
    recognition.onerror = () => {
      setListening(false);
    };
  }, [onTranscript]);

  const handleToggle = () => {
    if (!supported || disabled) return;
    const recognition = recognitionRef.current;
    if (!recognition) return;
    if (listening) {
      recognition.stop?.();
      setListening(false);
      return;
    }
    setListening(true);
    recognition.start?.();
  };

  const label = supported ? (listening ? "Stop voice input" : "Use voice input") : "Voice input unavailable";

  return (
    <Tooltip content={label}>
      <button
        type="button"
        onClick={handleToggle}
        className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition hover:border-white/30 hover:text-white ${
          disabled || !supported ? "opacity-40" : ""
        } ${listening ? "border-indigo-400 text-white shadow-glow" : ""}`}
        aria-label={label}
        aria-pressed={listening}
        disabled={disabled || !supported}
      >
        {supported ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
      </button>
    </Tooltip>
  );
}
