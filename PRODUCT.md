# Creo — AI Creative Platform

Платформа для создания AI-креативов и дипфейков. Дизайнеры и маркетологи могут легко воплощать свои идеи и делать качественные рекламные видео.

## MVP фичи

1. **Voice Cloning** — клонирование голоса персонажей из YouTube видео. Пользователь вставляет ссылку на видео, указывает таймкоды (от–до) и название голоса — система клонирует голос через внешнее API.
2. **Lip Sync** — синхронизация губ с аудио/голосом.
3. **Script Editor** — редактор для написания сценариев.
4. **Video Editor** — видео-редактор (timeline, cuts, effects).
5. **Media Library** — библиотека вставок для видео (stock footage, overlays, transitions).

## Стек

- **Monorepo:** Nx
- **Frontend:** React 19, Ant Design, Vite, SCSS Modules, react-i18next
- **Backend:** NestJS
- **AI/ML:** Внешние API (конкретные сервисы TBD)

## Структура

```
apps/
  web/          — фронтенд (React)
  api/          — бэкенд (NestJS)
libs/
  ui/           — общая UI-библиотека (Ant Design обертки, тема)
```
