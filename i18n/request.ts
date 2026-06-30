import { getRequestConfig } from "next-intl/server";

import esMessages from "../messages/es.json";
import enMessages from "../messages/en.json";

const messages: Record<string, any> = {
  es: esMessages,
  en: enMessages,
};

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = (await requestLocale) || "es";
  return {
    locale,
    messages: messages[locale] || messages.es,
  };
});
