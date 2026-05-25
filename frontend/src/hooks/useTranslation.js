import { useLang } from '../context/LanguageContext'
import { translations } from '../i18n/translations'

export function useTranslation() {
  const { lang } = useLang()
  function t(key) {
    return translations[lang]?.[key] ?? translations.en[key] ?? key
  }
  return { t, lang }
}
