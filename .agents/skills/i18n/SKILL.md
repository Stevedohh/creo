---
name: i18n
description: Internationalization (i18n) patterns for the React frontend using react-i18next. Covers adding translations, new languages, and best practices.
origin: project
---

# Internationalization (i18n)

The frontend uses **react-i18next** + **i18next** for internationalization.

## When to Activate

- Adding new user-facing text to components
- Adding a new language
- Working with translation keys or locale files
- Reviewing components for hardcoded strings

## Project Structure

```
apps/web/src/i18n/
├── i18n.ts              # i18next configuration and initialization
└── locales/
    ├── en.json          # English translations (default/fallback)
    └── uk.json          # Ukrainian translations
```

## Setup Overview

- **i18n config**: `apps/web/src/i18n/i18n.ts` — initializes i18next with `initReactI18next`
- **Import**: `main.tsx` imports `./i18n/i18n` as a side-effect to initialize before render
- **Default language**: `en`
- **Fallback language**: `en`

## Adding Translations to a Component

```tsx
import { useTranslation } from 'react-i18next';

export function MyComponent() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('myFeature.title')}</h1>
      <p>{t('myFeature.description')}</p>
    </div>
  );
}
```

## Translation File Format

Translations use nested JSON. Group keys by feature/page:

```json
{
  "app": {
    "title": "Creo",
    "subtitle": "Welcome to Creo"
  },
  "myFeature": {
    "title": "Feature Title",
    "description": "Feature description"
  }
}
```

## Adding a New Translation Key

1. Add the key to **all** locale files (`en.json`, `uk.json`, etc.)
2. Use the key in the component via `t('namespace.key')`

### Example

Add to `apps/web/src/i18n/locales/en.json`:
```json
{
  "settings": {
    "title": "Settings",
    "save": "Save Changes"
  }
}
```

Add to `apps/web/src/i18n/locales/uk.json`:
```json
{
  "settings": {
    "title": "Налаштування",
    "save": "Зберегти зміни"
  }
}
```

## Adding a New Language

1. Create a new locale file: `apps/web/src/i18n/locales/{lang}.json`
2. Copy the structure from `en.json` and translate all values
3. Register it in `apps/web/src/i18n/i18n.ts`:

```ts
import de from './locales/de.json';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    uk: { translation: uk },
    de: { translation: de },  // <-- add here
  },
  // ...
});
```

## Switching Language at Runtime

```tsx
import { useTranslation } from 'react-i18next';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  return (
    <select
      value={i18n.language}
      onChange={(e) => i18n.changeLanguage(e.target.value)}
    >
      <option value="en">English</option>
      <option value="uk">Українська</option>
    </select>
  );
}
```

## Interpolation

```json
{
  "greeting": "Hello, {{name}}!"
}
```

```tsx
t('greeting', { name: 'World' })  // "Hello, World!"
```

## Pluralization

```json
{
  "items_one": "{{count}} item",
  "items_other": "{{count}} items"
}
```

```tsx
t('items', { count: 5 })  // "5 items"
```

## Rules

- **Never hardcode user-facing strings** — always use translation keys
- **Always add keys to all locale files** to avoid missing translations
- **Use nested keys** grouped by feature/page (e.g., `settings.title`, not `settingsTitle`)
- **Keep `en.json` as the source of truth** — translate from English to other languages
- **Fallback language is `en`** — if a key is missing in a locale, English is shown
