import { getRequestConfig } from "next-intl/server";
import vi from "@/messages/vi.json";
import en from "@/messages/en.json";

const MESSAGES = { vi, en } as const;

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = requested === "en" ? "en" : "vi";
  return {
    locale,
    messages: MESSAGES[locale],
    timeZone: "Asia/Ho_Chi_Minh",
  };
});