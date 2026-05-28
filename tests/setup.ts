import '@testing-library/jest-dom'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import es from '../src/i18n/locales/es.json'
import en from '../src/i18n/locales/en.json'

// Initialize i18n for all tests — components using useTranslation() work without explicit providers
if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    lng: 'es',
    fallbackLng: 'en',
    resources: {
      es: { translation: es },
      en: { translation: en },
    },
    interpolation: { escapeValue: false },
  })
}
