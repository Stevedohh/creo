# Creo

AI-платформа для создания креативного контента: дипфейки, клонирование голоса, lip sync, видеоредактирование для рекламы.

## Требования

- Node.js 20+
- npm
- Docker & Docker Compose

## Локальная разработка

### 1. Установка зависимостей

```bash
npm install
```

### 2. Настройка окружения

```bash
cp .env.example .env
```

Отредактируй `.env` при необходимости (API-ключи, порты и т.д.).

### 3. Запуск PostgreSQL

```bash
npm run db:up
```

Поднимает контейнер PostgreSQL на порту `5433` (настраивается через `POSTGRES_PORT` в `.env`).

### 4. Применение миграций

```bash
npm run db:migrate
```

### 5. Запуск приложения

```bash
npm start
```

Это запустит одновременно:
- **API** (NestJS) — `http://localhost:3000/api`
- **Web** (React + Vite) — `http://localhost:4300`

### Остановка

Остановить dev-серверы: `Ctrl+C` в терминале.

Остановить PostgreSQL:

```bash
npm run docker:down
```

## Docker (полный стек)

Поднять всё (PostgreSQL + API + Web) одной командой:

```bash
npm run docker:build   # собрать образы (первый раз или после изменений в зависимостях)
npm run docker:up      # запустить все сервисы
```

- **PostgreSQL** — порт `5433`
- **API** (NestJS) — `http://localhost:3000/api`
- **Web** (React + Vite) — `http://localhost:4300`

Исходники маунтятся в контейнеры — изменения в коде подхватываются автоматически (hot reload).

```bash
npm run docker:logs    # посмотреть логи
npm run docker:down    # остановить всё
```

## Работа с БД

| Команда | Описание |
|---|---|
| `npm run db:up` | Поднять PostgreSQL |
| `npm run db:migrate` | Создать и применить миграции |
| `npm run db:generate` | Перегенерировать Prisma Client |
| `npm run db:studio` | Открыть Prisma Studio (веб-GUI для БД) |
| `npm run db:reset` | Сбросить БД и накатить миграции заново |

## Подключение к БД из IDE

- **Host:** `localhost`
- **Port:** `5433`
- **Database:** `creo`
- **User:** `creo`
- **Password:** `creo`

## Структура проекта

```
apps/
  api/          — NestJS бекенд
  web/          — React + Vite фронтенд
libs/
  prisma/       — Prisma схема, миграции, PrismaService
  shared/       — Общие утилиты
  shell/        — Layout и навигация
  ui/           — Дизайн-система
  voice-clone/  — Фича клонирования голоса (api, feature, data-access)
```

## AI Design & QA (gstack)

Проект использует [gstack](https://github.com/garrytan/gstack) — набор AI-инструментов для дизайна и тестирования прямо из Claude Code.

### Установка

```bash
git clone --single-branch --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack
cd ~/.claude/skills/gstack && ./setup
```

Требуется [bun](https://bun.sh/) v1.0+. После установки перезапусти Claude Code.

### Дизайн

| Команда | Описание |
|---|---|
| `/design-consultation` | Полный дизайн-процесс: ресерч → мудборд → мокапы → дизайн-система |
| `/design-shotgun` | Генерация 4-6 вариантов мокапов с интерактивным выбором |
| `/design-html` | Конвертация мокапа в production HTML |
| `/design-review` | Аудит текущего UI с автоматическими фиксами в atomic коммитах |

### QA

| Команда | Описание |
|---|---|
| `/qa` | Запуск Chromium, поиск багов, автофикс + генерация regression тестов |
| `/qa-only` | Поиск и репорт багов без изменений в коде |
| `/browse` | Тестирование через реальный браузер |

### Workflow

1. **`/design-consultation`** — описываешь страницу или фичу, получаешь дизайн-систему и мокапы
2. **`/design-shotgun`** — генерируешь несколько вариантов, выбираешь лучший
3. Реализуешь фичу в коде
4. **`/design-review`** — аудит реализации, автофиксы расхождений с дизайном
5. **`/qa`** — тестирование в реальном браузере, автофикс багов и генерация тестов

> Для `/qa` и `/browse` приложение должно быть запущено локально (`npm start`).
