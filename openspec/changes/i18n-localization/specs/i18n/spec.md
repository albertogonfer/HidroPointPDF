# i18n Specification

## Purpose

Defines requirements for internationalization: language initialization, switching, persistence, string translation, and locale-aware formatting.

## Requirements

### Requirement: Default Language

The system MUST initialize with Spanish (`es`) as the active language regardless of browser locale.

#### Scenario: First visit with English browser

- GIVEN a user visits the app for the first time with browser locale `en-US`
- WHEN the app loads
- THEN all UI strings MUST render in Spanish
- AND localStorage key `hidropoint-lang` MUST be set to `es`

### Requirement: Language Switching

The system MUST provide a `<select>` element in the header that allows switching between ES and EN.

#### Scenario: Switch to English

- GIVEN the app is displaying in Spanish
- WHEN the user selects "EN" from the language switcher
- THEN all visible strings MUST update to English without page reload
- AND localStorage key `hidropoint-lang` MUST be set to `en`

#### Scenario: Switch back to Spanish

- GIVEN the app is displaying in English
- WHEN the user selects "ES" from the language switcher
- THEN all visible strings MUST update to Spanish without page reload

### Requirement: Language Persistence

The system MUST persist the selected language in localStorage and restore it on subsequent visits.

#### Scenario: Reload after switching to English

- GIVEN the user previously selected English
- WHEN the user reloads the page
- THEN the app MUST load in English

### Requirement: Translation Coverage

The system MUST translate all 55 user-facing string keys in both `es.json` and `en.json`.

#### Scenario: No untranslated strings on IntakePage

- GIVEN the app is running in English
- WHEN the user navigates to the Rename page
- THEN all visible text (title, subtitle, dropzone, table headers, status badges) MUST be in English

#### Scenario: FeedbackForm error messages translated

- GIVEN the app is running in English
- WHEN form validation fails or submission errors
- THEN error messages MUST display in English

### Requirement: Status Labels via t()

The system MUST render `statusConfig` labels using `t()` at render time, not at module initialization.

#### Scenario: Status badges update on language switch

- GIVEN PreviewTable is displaying rows with status badges in Spanish
- WHEN the user switches to English
- THEN badge labels MUST update to English immediately

### Requirement: Locale-Aware Date Formatting

The `formatDate` function MUST use the current i18n language to determine the locale for `toLocaleDateString`.

#### Scenario: Dates in English locale

- GIVEN the app language is English
- WHEN HistoryList renders dates
- THEN dates MUST format using `en` locale (e.g., "May 28, 2026")

### Requirement: Rich Text Translation

The system MUST use the `Trans` component for strings containing inline HTML elements.

#### Scenario: FeedbackForm success banner with link

- GIVEN a feedback report was submitted successfully
- WHEN the success banner renders
- THEN it MUST display translated text with a clickable `<a>` link to the GitHub issue
