import { useTranslation } from 'react-i18next'

export function LanguageSwitcher() {
  const { i18n } = useTranslation()

  return (
    <select
      aria-label={i18n.t('languageSwitcher.label')}
      value={i18n.language}
      onChange={(e) => i18n.changeLanguage(e.target.value)}
      className="cursor-pointer bg-transparent text-sm text-gray-500 focus:outline-none"
    >
      <option value="es">Español</option>
      <option value="en">English</option>
    </select>
  )
}
