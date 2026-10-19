import { createI18n, type VueI18nOptions } from 'vue-i18n';

type LocaleMessages = NonNullable<VueI18nOptions['messages']>[string];

const messages = Object.fromEntries(
  Object.entries(
    import.meta.glob<{ default: LocaleMessages }>('./locales/*.json', {
      eager: true,
    })
  ).map(([key, value]) => [key.slice(10, -5), value.default])
);

export default createI18n({
  legacy: false,
  locale: localStorage.getItem('lang') || 'en',
  fallbackLocale: 'en',
  messages,
});
