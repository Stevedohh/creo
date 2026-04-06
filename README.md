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
