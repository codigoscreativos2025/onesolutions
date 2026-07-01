"use client";

import { useLocale } from "@/lib/locale-context";

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();

  const switchLocale = () => {
    const newLocale = locale === "es" ? "en" : "es";
    setLocale(newLocale);
  };

  return (
    <button
      onClick={switchLocale}
      className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-highest transition-colors active:scale-90 font-bold text-sm"
      aria-label="Cambiar idioma"
      title={locale === "es" ? "Switch to English" : "Cambiar a Español"}
    >
      <span className="text-xs font-bold text-on-surface-variant">
        {locale === "es" ? "EN" : "ES"}
      </span>
    </button>
  );
}
