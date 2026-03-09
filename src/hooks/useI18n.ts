import { useMemo } from 'react';
import type { LocaleMessages } from '@/i18n/messages';
import { localeMessages } from '@/i18n/messages';
import { useConfigStore } from '@/stores/configStore';
import type { AppLocale } from '@/types/config';

const readLocaleValue = (messages: LocaleMessages, key: string) => {
  return messages[key as keyof LocaleMessages];
};

export const useI18n = () => {
  const locale = useConfigStore((state) => state.locale);
  const setLocale = useConfigStore((state) => state.setLocale);

  const messages = useMemo(() => localeMessages[locale] ?? localeMessages.en, [locale]);

  const t = useMemo(() => {
    return (key: string) => {
      const localizedValue = readLocaleValue(messages, key);
      if (typeof localizedValue === 'string') {
        return localizedValue;
      }

      const fallbackValue = readLocaleValue(localeMessages.en, key);
      return typeof fallbackValue === 'string' ? fallbackValue : key;
    };
  }, [messages]);

  return {
    locale,
    setLocale: (nextLocale: AppLocale) => setLocale(nextLocale),
    messages,
    t,
  };
};
