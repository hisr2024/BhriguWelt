"use client";

import { useState } from "react";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिंदी" },
  { code: "es", label: "Español" },
  { code: "ta", label: "தமிழ்" },
];

export default function LanguageToggle({ compact = false }: { compact?: boolean }) {
  const [language, setLanguage] = useState("en");

  return (
    <label
      className={`flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-2 text-xs uppercase tracking-wide text-slate-200 ${
        compact ? "px-2 py-1 text-[10px]" : ""
      }`}
    >
      <span className="sr-only">Language toggle</span>
      <span aria-hidden>🌐</span>
      <select
        aria-label="Language toggle"
        value={language}
        onChange={(event) => setLanguage(event.target.value)}
        className="bg-transparent text-slate-100"
      >
        {LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code} className="text-slate-900">
            {lang.label}
          </option>
        ))}
      </select>
    </label>
  );
}
