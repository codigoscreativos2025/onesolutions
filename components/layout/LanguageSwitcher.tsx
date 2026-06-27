"use client";

import { usePathname, useRouter } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = useLocale();

  const switchLocale = () => {
    const newLocale = currentLocale === "es" ? "en" : "es";
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <button
      onClick={switchLocale}
      className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container-highest transition-colors active:scale-90 font-bold text-sm"
      aria-label="Switch language"
    >
      <Globe className="w-5 h-5" />
    </button>
  );
}
