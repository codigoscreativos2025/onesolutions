"use client";

import { Globe } from "lucide-react";

export function LanguageSwitcher() {
  // Language switching is currently disabled
  // TODO: Implement full i18n system with context

  return (
    <button
      className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container-highest transition-colors active:scale-90 font-bold text-sm opacity-50 cursor-not-allowed"
      aria-label="Switch language (coming soon)"
      title="Cambio de idioma próximamente"
    >
      <Globe className="w-5 h-5" />
    </button>
  );
}
