import type { LanguageId } from '../state/types';
import { useMetaStore } from '../state/metaStore';
import { dictEn, type DictKey } from './dict.en';
import { dictJa } from './dict.ja';

const dicts: Record<LanguageId, Partial<Record<DictKey, string>>> = {
  en: dictEn,
  ja: dictJa,
};

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) => (k in params ? String(params[k]) : `{${k}}`));
}

export function translate(
  key: DictKey,
  params?: Record<string, string | number>,
  language?: LanguageId,
): string {
  const lang = language ?? useMetaStore.getState().settings.language;
  const fromActive = dicts[lang]?.[key];
  const text = fromActive ?? dictEn[key] ?? key;
  return interpolate(text, params);
}

// React hook variant: re-renders when language setting changes.
export function useT(): (key: DictKey, params?: Record<string, string | number>) => string {
  const language = useMetaStore((s) => s.settings.language);
  return (key, params) => translate(key, params, language);
}

export type { DictKey };
