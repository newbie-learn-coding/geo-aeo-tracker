import { en } from "./en";
import { zh } from "./zh";
import type { Dictionary, Locale } from "./types";

export type { Dictionary, Locale };
export { DEFAULT_LOCALE, LOCALES } from "./types";

const dictionaries: Record<Locale, Dictionary> = { en, zh };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries.en;
}
