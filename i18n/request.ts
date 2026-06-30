import { getRequestConfig } from "next-intl/server";
import esMessages from "../messages/es.json";

export default getRequestConfig(async () => {
  return {
    locale: "es",
    messages: esMessages,
  };
});
