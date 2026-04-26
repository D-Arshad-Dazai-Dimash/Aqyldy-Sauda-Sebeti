# Aqyldy Sauda Sebeti — Умная Торговая Корзина

<p align="center">
  <img src="https://img.shields.io/badge/React%20Native-0.83-61DAFB?style=for-the-badge&logo=react" />
  <img src="https://img.shields.io/badge/Spring%20Boot-3.3.5-6DB33F?style=for-the-badge&logo=springboot" />
  <img src="https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql" />
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker" />
  <img src="https://img.shields.io/badge/Java-17-ED8B00?style=for-the-badge&logo=openjdk" />
</p>

**Aqyldy Sauda Sebeti** (каз. «Умная Торговая Корзина») — полнофункциональное мобильное приложение для умных покупок в магазинах Казахстана. Сканирование штрих-кодов, каталог товаров, корзина, история заказов, аналитика расходов на базе ML, AI-рекомендации, анализ трендов цен и умный чатбот-ассистент на базе Google Gemini. Двуязычный интерфейс: казахский 🇰🇿 и русский 🇷🇺.

> **Репозиторий:** https://github.com/D-Arshad-Dazai-Dimash/Aqyldy-Sauda-Sebeti

---

## Содержание

- [Возможности](#возможности)
- [Архитектура проекта](#архитектура-проекта)
- [Стек технологий](#стек-технологий)
- [Требования](#требования)
- [Быстрый старт](#быстрый-старт)
- [Пошаговый запуск (вручную)](#пошаговый-запуск-вручную)
- [Переменные окружения](#переменные-окружения)
- [Деплой в Render](#деплой-в-render)
- [API-эндпоинты (Backend)](#api-эндпоинты-backend)
- [AI-сервис (Python FastAPI)](#ai-сервис-python-fastapi)
- [Структура проекта](#структура-проекта)
- [Экраны приложения](#экраны-приложения)
- [База данных](#база-данных)
- [Тестирование](#тестирование)
- [Установка JDK 17](#установка-jdk-17)
- [Типовые проблемы](#типовые-проблемы)

---

## Возможности

### Для покупателей
- **Каталог товаров** — просмотр по категориям с фильтрами и поиском
- **Сканирование штрих-кода** — мгновенное нахождение товара через камеру
- **Корзина** — добавление товаров, изменение количества, оформление заказа
- **Избранное** — сохранение понравившихся товаров
- **История заказов** — список всех покупок с детальным просмотром
- **Аналитика расходов** — визуальные графики трат по категориям с ML-прогнозом бюджета
- **AI-рекомендации** — персональные рекомендации и товары «часто покупают вместе»
- **Тренды цен** — история изменения цены товара и прогноз на 14 дней вперёд
- **Акции** — отдельная страница с товарами по сниженным ценам и бейджами скидок
- **Умные покупки** — AI-подборка товаров на основе предпочтений пользователя
- **Чатбот-ассистент** — умный AI-помощник по покупкам (Google Gemini 2.0 Flash)
- **Карта магазинов** — просмотр расположения торговых точек
- **PIN-код безопасности** — защита приложения 4-значным PIN с биометрией

### Для бизнеса (продавцы)
- **Бизнес-панель** — дашборд статистики продаж
- **Управление инвентарём** — просмотр и редактирование складских остатков
- **Управление заказами** — обработка входящих заказов покупателей
- **Добавление товаров** — форма для загрузки новых позиций в каталог с фото

---

## Архитектура проекта

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       React Native App (Android)                        │
│                     Metro Bundler — порт 8081                           │
└────────────┬────────────────────────────────────┬───────────────────────┘
             │ HTTP REST                           │ HTTP REST
             │ порт 8080                           │ порт 8000
             ▼                                     ▼
┌────────────────────────┐             ┌───────────────────────────┐
│  Spring Boot 3.3.5     │             │  FastAPI (Python)         │
│  REST API              │             │  AI Microservice          │
│                        │             │                           │
│  Spring Security + JWT │             │  • Рекомендации (ML)      │
│  Spring Data JPA       │             │  • Тренды цен (sklearn)   │
│  Flyway Migrations     │             │  • Чатбот (Gemini 2.0)    │
│  Springdoc OpenAPI     │             │  Swagger: /docs           │
└─────────┬──────────────┘             └──────────┬────────────────┘
          │                                        │
          │  JDBC (55432)                          │  SQLAlchemy
          ▼                                        ▼
┌──────────────────────────────────────────────────────────────────┐
│                     PostgreSQL 16 (Docker)                       │
│                         порт 55432                               │
│              база: dbaqyldy / user: aqsa                         │
└──────────────────────────────────────────────────────────────────┘
```

Оба сервиса (Spring Boot и FastAPI) работают с **одной базой данных** PostgreSQL. AI-сервис читает историю заказов и цен напрямую для построения ML-моделей.

---

## Стек технологий

### Frontend (React Native)

| Библиотека | Версия | Назначение |
|-----------|--------|------------|
| React Native | 0.83.0 | Мобильный фреймворк |
| React | 19.2.0 | UI-рендеринг |
| TypeScript | 5.8.3 | Типизация |
| React Navigation | 7.x | Навигация (Stack + BottomTabs) |
| react-native-reanimated | 4.2.2 | Анимации (FadeIn, Spring, SharedValue) |
| Zustand | 5.0.12 | Глобальное состояние |
| Axios | 1.13.6 | HTTP-клиент |
| react-native-vision-camera | 4.7.3 | Камера для сканирования |
| react-native-vector-icons | 10.3.0 | Иконки (Feather) |
| react-native-safe-area-context | 5.7.0 | Safe area / notch |
| react-native-keychain | 10.0.0 | Хранение токенов |
| react-hook-form + zod | — | Формы и валидация |
| react-native-svg | 15.15.3 | SVG-графика |

### Backend (Spring Boot)

| Библиотека | Версия | Назначение |
|-----------|--------|------------|
| Spring Boot | 3.3.5 | Фреймворк |
| Java | 17 | Язык |
| Spring Security | — | Аутентификация и авторизация |
| jjwt | 0.12.6 | JWT-токены |
| Spring Data JPA | — | ORM |
| PostgreSQL Driver | — | Подключение к БД |
| Flyway | — | Миграции базы данных |
| Springdoc OpenAPI | 2.6.0 | Swagger UI |
| Lombok | — | Генерация boilerplate |

### AI-сервис (Python)

| Библиотека | Версия | Назначение |
|-----------|--------|------------|
| FastAPI | 0.115.12 | Web-фреймворк |
| Uvicorn | 0.34.3 | ASGI-сервер |
| SQLAlchemy | 2.0.41 | ORM для PostgreSQL |
| psycopg2-binary | 2.9.10 | PostgreSQL драйвер |
| scikit-learn | 1.6.1 | ML-модели рекомендаций и прогнозов |
| NumPy | 2.2.5 | Числовые вычисления |
| google-generativeai | 0.8.5 | Google Gemini API (чатбот) |
| Pydantic | 2.11.7 | Валидация данных |

### Инфраструктура

| Компонент | Назначение |
|-----------|------------|
| Docker + Docker Compose | Оркестрация PostgreSQL |
| PostgreSQL 16 | Основная база данных |
| Flyway | Версионные миграции схемы |

---

## Требования

| Компонент | Версия | Обязательно |
|-----------|--------|-------------|
| **Java JDK** | **17 (строго 17!)** | ✅ |
| **Node.js** | 20+ | ✅ |
| **npm** | 10+ | ✅ |
| **Docker Desktop** | любая | ✅ |
| **Android Studio** | с SDK 34+ | ✅ |
| **Python** | 3.11+ | Только для AI-сервиса |

> ⚠️ Проект жёстко проверяет **JDK 17** в `build.gradle`. Java 11, 21, 22 вызовут ошибку сборки.

---

## Быстрый старт

### 1. Клонировать репозиторий

```powershell
git clone https://github.com/D-Arshad-Dazai-Dimash/Aqyldy-Sauda-Sebeti.git
cd "Aqyldy-Sauda-Sebeti"
```

### 2. Создать файл с секретами

Создайте `.env` в корне проекта:

```env
JWT_SECRET=your-secret-key-at-least-32-chars-long!!
GEMINI_API_KEY=your-google-gemini-api-key
```

### 3. Запустить все сервисы

**Терминал 1 — База данных:**
```powershell
docker compose up -d
docker compose ps   # Убедиться, что статус "healthy"
```

**Терминал 2 — Backend:**
```powershell
cd Backend/project
$env:JWT_SECRET = "your-secret-key-at-least-32-chars-long!!"
.\gradlew.bat bootRun
```

**Терминал 3 — AI-сервис:**
```powershell
cd ai-service
pip install -r requirements.txt
python main.py
```

**Терминал 4 — Metro bundler:**
```powershell
cd frontend
npm install
npm start
```

**Терминал 5 — Android app:**
```powershell
cd frontend
npm run android
```

---

## Пошаговый запуск (вручную)

### Шаг 1: PostgreSQL (Docker)

```powershell
docker compose up -d
```

Параметры подключения:

| Параметр | Значение |
|----------|----------|
| Host | `localhost` |
| Port | `55432` |
| Database | `dbaqyldy` |
| User | `aqsa` |
| Password | `aqyldysebet123` |

Проверить подключение:
```powershell
docker exec -it aqyldy_sauda_sebeti__db psql -U aqsa -d dbaqyldy -c "\dt"
```

### Шаг 2: Backend (Spring Boot)

```powershell
cd Backend/project

$env:DB_URL    = "jdbc:postgresql://localhost:55432/dbaqyldy"
$env:DB_USER   = "aqsa"
$env:DB_PASS   = "aqyldysebet123"
$env:JWT_SECRET = "your-secret-key-at-least-32-chars!!"

.\gradlew.bat bootRun
```

Flyway автоматически применит все миграции при первом запуске.

- API: http://localhost:8080
- Swagger UI: http://localhost:8080/swagger

### Шаг 3: AI-сервис (Python)

```powershell
cd ai-service

python -m venv venv
.\venv\Scripts\activate

pip install -r requirements.txt

# Создать .env
@"
DB_HOST=localhost
DB_PORT=55432
DB_NAME=dbaqyldy
DB_USER=aqsa
DB_PASS=aqyldysebet123
GEMINI_API_KEY=your_key_here
"@ | Out-File -FilePath .env -Encoding utf8

python main.py
```

- AI-сервис: http://localhost:8000
- Swagger AI: http://localhost:8000/docs

### Шаг 4: Frontend (React Native Android)

```powershell
cd frontend

npm install          # Один раз или после git pull

# Терминал 1 — Metro bundler
npm start

# Терминал 2 — Android эмулятор
npm run android
```

> Android эмулятор должен быть запущен через AVD Manager в Android Studio перед `npm run android`.

---

## Переменные окружения

### Backend

| Переменная | По умолчанию | Описание |
|-----------|-------------|----------|
| `DB_URL` | `jdbc:postgresql://localhost:55432/dbaqyldy` | JDBC URL |
| `DB_USER` | `aqsa` | Пользователь PostgreSQL |
| `DB_PASS` | `aqyldysebet123` | Пароль PostgreSQL |
| `JWT_SECRET` | — | **Обязательно!** Секрет JWT ≥32 символа |
| `JWT_EXPIRATION` | `86400000` | Время жизни токена (мс, 24 часа) |

## Деплой в Render

В репозиторий добавлен blueprint-файл [render.yaml](render.yaml), который создает:
- `aqyldy-backend` (Spring Boot)
- `aqyldy-ai-service` (FastAPI)
- `aqyldy-postgres` (PostgreSQL)

### 1. Импорт blueprint

1. В Render нажмите **New +** → **Blueprint**.
2. Выберите этот репозиторий.
3. Render прочитает [render.yaml](render.yaml) и предложит создать 3 сервиса.

### 2. Заполните обязательные env-переменные

Для `aqyldy-backend`:
- `SPRING_PROFILES_ACTIVE=prod`
- `JAVA_VERSION=17`
- `DB_URL=jdbc:postgresql://<host>:5432/<db_name>`
- `DB_USER=<db_user>`
- `DB_PASS=<db_password>`
- `JWT_SECRET=<минимум 32 символа>`
- `APP_CORS_ALLOWED_ORIGINS=https://<frontend-domain>,https://*.onrender.com`

Для `aqyldy-ai-service`:
- `DB_HOST=<host>`
- `DB_PORT=5432`
- `DB_NAME=<db_name>`
- `DB_USER=<db_user>`
- `DB_PASS=<db_password>`
- `JWT_SECRET=<тот же, что у backend>`
- `GEMINI_API_KEY=<google api key>`
- `CORS_ALLOWED_ORIGINS=https://<frontend-domain>,https://*.onrender.com`

### 3. Проверка после деплоя

- Backend health: `https://<backend>.onrender.com/health`
- AI health: `https://<ai-service>.onrender.com/health`

Если оба endpoint возвращают `status: ok`, сервисы готовы для подключения мобильного клиента.

### AI-сервис (`ai-service/.env`)

| Переменная | По умолчанию | Описание |
|-----------|-------------|----------|
| `DB_HOST` | `localhost` | Хост PostgreSQL |
| `DB_PORT` | `55432` | Порт PostgreSQL |
| `DB_NAME` | `dbaqyldy` | Имя базы данных |
| `DB_USER` | `aqsa` | Пользователь |
| `DB_PASS` | — | Пароль |
| `GEMINI_API_KEY` | — | Ключ Google Gemini API |
| `GEMINI_MODEL` | `gemini-2.0-flash` | Модель Gemini |

> Получить бесплатный `GEMINI_API_KEY`: https://aistudio.google.com/app/apikey

---

## API-эндпоинты (Backend)

Полная документация: **http://localhost:8080/swagger**

### Аутентификация — `/api/auth`

| Метод | Путь | Auth | Описание |
|-------|------|------|----------|
| `POST` | `/api/auth/register` | — | Регистрация покупателя |
| `POST` | `/api/auth/register/business` | — | Регистрация продавца |
| `POST` | `/api/auth/login` | — | Логин → `access_token` + `refresh_token` |
| `POST` | `/api/auth/refresh` | — | Обновить access-токен |
| `POST` | `/api/auth/logout` | JWT | Инвалидировать токен |
| `POST` | `/api/auth/forgot-password` | — | Письмо для сброса пароля |
| `POST` | `/api/auth/reset-password` | Токен | Установить новый пароль |

### Пользователь — `/api`

| Метод | Путь | Auth | Описание |
|-------|------|------|----------|
| `GET` | `/api/me` | JWT | Профиль текущего пользователя |
| `PUT` | `/api/me` | JWT | Обновить имя / телефон |
| `GET` | `/api/admin` | JWT+ADMIN | Список всех пользователей |

### Каталог (публичный)

| Метод | Путь | Параметры | Описание |
|-------|------|-----------|----------|
| `GET` | `/api/categories` | — | Список категорий |
| `GET` | `/api/products` | `search`, `category`, `storeId`, `minPrice`, `maxPrice`, `page`, `size` | Товары с фильтрами |
| `GET` | `/api/products/{id}` | — | Товар по UUID |
| `GET` | `/api/products/barcode/{barcode}` | — | Поиск по штрих-коду |
| `POST` | `/api/products/batch` | `{ ids: [...] }` | Несколько товаров по ID |

### Каталог (ADMIN)

| Метод | Путь | Описание |
|-------|------|----------|
| `POST` | `/api/admin/products` | Создать товар |
| `PUT` | `/api/admin/products/{id}` | Обновить товар |
| `DELETE` | `/api/admin/products/{id}` | Удалить товар |
| `POST` | `/api/admin/products/{id}/image` | Загрузить изображение |
| `POST` | `/api/admin/categories` | Создать категорию |
| `PUT` | `/api/admin/categories/{id}` | Обновить категорию |
| `DELETE` | `/api/admin/categories/{id}` | Удалить категорию |

### Корзина — `/api/cart`

| Метод | Путь | Описание |
|-------|------|----------|
| `GET` | `/api/cart` | Содержимое корзины |
| `POST` | `/api/cart/items` | Добавить товар |
| `PUT` | `/api/cart/items/{itemId}` | Изменить количество |
| `DELETE` | `/api/cart/items/{itemId}` | Удалить позицию |
| `DELETE` | `/api/cart` | Очистить корзину |

### Заказы — `/api/orders`

| Метод | Путь | Описание |
|-------|------|----------|
| `POST` | `/api/orders/checkout` | Оформить заказ из корзины |
| `GET` | `/api/orders/my` | Мои заказы |
| `GET` | `/api/orders/{id}` | Детали заказа |
| `DELETE` | `/api/orders/{id}` | Отменить заказ |
| `GET` | `/api/admin/orders` | Все заказы (ADMIN) |
| `PUT` | `/api/admin/orders/{id}/status` | Сменить статус (ADMIN) |

### Избранное — `/api/favorites`

| Метод | Путь | Описание |
|-------|------|----------|
| `GET` | `/api/favorites` | Список избранного |
| `GET` | `/api/favorites/ids` | Только ID избранных |
| `POST` | `/api/favorites/{productId}` | Добавить |
| `DELETE` | `/api/favorites/{productId}` | Убрать |

### Магазины — `/api/stores`

| Метод | Путь | Описание |
|-------|------|----------|
| `GET` | `/api/stores` | Список магазинов |
| `GET` | `/api/stores/{id}` | Магазин по ID |
| `GET` | `/api/stores/{id}/inventory` | Инвентарь |
| `GET` | `/api/stores/{id}/products` | Товары |
| `GET` | `/api/stores/my` | Мой магазин (BUSINESS) |

### Прочие эндпоинты

| Метод | Путь | Описание |
|-------|------|----------|
| `POST` | `/api/scan` | Сканировать штрих-код |
| `GET` | `/api/analytics/spending` | Аналитика расходов (`?period=month`) |
| `GET` | `/api/price-insights/{productId}` | История цен товара |
| `GET` | `/api/recommendations/together/{productId}` | «Покупают вместе» |
| `GET` | `/api/recommendations/personal` | Персональные рекомендации |
| `GET` | `/api/recommendations/popular` | Популярные товары |
| `GET` | `/api/admin/stats` | Бизнес-статистика |
| `GET` | `/api/admin/inventory` | Инвентарь (ADMIN) |
| `POST` | `/api/admin/inventory` | Обновить запасы (ADMIN) |

---

## AI-сервис (Python FastAPI)

Документация: **http://localhost:8000/docs**

### `GET /api/ai/recommendations/product/{product_id}?limit=8`

Рекомендации на основе **co-purchase матрицы** — товары, которые часто покупают вместе с данным. Использует `cosine_similarity` из scikit-learn поверх `order_items`.

### `GET /api/ai/recommendations/user/{user_id}?limit=10`

Персональные рекомендации по истории заказов пользователя.

### `GET /api/ai/price-trends/{product_id}?days_ahead=14`

История цен из таблицы `price_history` + **LinearRegression** прогноз на N дней вперёд.

```json
{
  "product_id": "uuid",
  "history": [{ "date": "2025-01-01", "price": 450 }, ...],
  "prediction": [{ "date": "2025-04-19", "price": 463.5 }, ...],
  "trend": "rising"
}
```

### `POST /api/ai/chat`

```json
{
  "message": "Что купить к завтраку?",
  "user_id": "uuid",
  "conversation_history": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ]
}
```

Чатбот на **Google Gemini 2.0 Flash** с контекстом пользователя (история заказов, профиль).

### `GET /health`

```json
{ "status": "ok", "service": "ai-service" }
```

---

## Структура проекта

```
Aqyldy-Sauda-Sebeti/
│
├── docker-compose.yml              # PostgreSQL 16 + AI-сервис
│
├── Backend/project/                # Spring Boot REST API
│   ├── build.gradle                # Зависимости + проверка JDK 17
│   ├── gradlew.bat                 # Gradle wrapper (Windows)
│   └── src/
│       ├── main/
│       │   ├── java/com/darshad/project/
│       │   │   ├── ProjectApplication.java   # Entry point
│       │   │   ├── auth/           # JWT аутентификация
│       │   │   ├── cart/           # Корзина
│       │   │   ├── catalog/        # Товары, категории, история цен
│       │   │   ├── config/         # Security конфиг, CORS, OpenAPI
│       │   │   ├── exception/      # GlobalExceptionHandler
│       │   │   ├── favorite/       # Избранное
│       │   │   ├── order/          # Заказы
│       │   │   ├── scan/           # Сканирование штрих-кодов
│       │   │   ├── security/       # JWT фильтр, UserDetailsService
│       │   │   ├── store/          # Магазины и инвентарь
│       │   │   ├── analytics/      # Аналитика расходов
│       │   │   ├── recommendation/ # Proxy к AI-сервису
│       │   │   ├── admin/          # Статистика, инвентарь (ADMIN)
│       │   │   └── user/           # Профиль пользователя
│       │   └── resources/
│       │       ├── application.yml
│       │       ├── application-dev.yml
│       │       └── db/migration/
│       │           ├── V1__init.sql
│       │           ├── V2__schema_redesign.sql
│       │           └── V3__seed_data.sql
│       └── test/java/...           # JUnit 5 тесты (11 тест-классов)
│
├── ai-service/                     # Python FastAPI AI Microservice
│   ├── main.py                     # FastAPI app + CORS
│   ├── config.py                   # Pydantic Settings
│   ├── database.py                 # SQLAlchemy engine
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── models/schemas.py           # Pydantic схемы
│   ├── routers/
│   │   ├── recommendations.py
│   │   ├── price_trends.py
│   │   └── chatbot.py
│   └── services/
│       ├── recommendation_service.py   # co-purchase + cosine similarity
│       ├── price_trend_service.py      # LinearRegression прогноз цен
│       └── chatbot_service.py          # Google Gemini интеграция
│
└── frontend/                       # React Native (Android)
    ├── App.tsx                     # Точка входа
    ├── index.js
    ├── package.json
    ├── tsconfig.json
    ├── android/                    # Android Gradle
    └── src/
        ├── api/                    # Axios клиенты (один файл на модуль)
        │   ├── client.ts           # Axios instance + JWT interceptors
        │   ├── auth.ts, cart.ts, products.ts, orders.ts
        │   ├── ai.ts               # AI-сервис (чат, тренды, рекомендации)
        │   ├── analytics.ts, priceInsights.ts, favorites.ts
        │   ├── stores.ts, scan.ts, categories.ts
        │   └── recommendations.ts
        ├── app/navigation.tsx      # React Navigation (Stack + BottomTabs)
        ├── screens/                # 32 экрана
        ├── store/                  # Zustand сторы
        │   ├── authStore.ts        # user, role, token, logout, changePin
        │   ├── cartStore.ts        # cart, storeId, fetchCart, updateItem
        │   ├── favoritesStore.ts
        │   └── languageStore.ts    # language (kk/ru)
        ├── components/             # Переиспользуемые компоненты
        ├── config/api.ts           # BASE_URL конфигурация
        ├── constants/              # Категории, моковые данные
        ├── types/                  # TypeScript типы
        └── utils/
            ├── useHeaderLayout.ts  # Хук: отступ header под notch
            ├── useI18n.ts          # Хук: двуязычность (kk/ru)
            └── appPin.ts           # PIN-код и биометрия
```

---

## Экраны приложения

### Навигация

- **`NativeStack`** — основной стек навигации
- **`BottomTabNavigator` (покупатель)** — Главная, Категории, Сканер, Избранное, Профиль
- **`BusinessTabNavigator` (продавец)** — Дашборд, Инвентарь, Заказы, Профиль
- **Deep linking:** `aqyldysebet://reset-password/:token`

### Список всех экранов

| Экран | Файл | Роль | Описание |
|-------|------|------|----------|
| Логин | `LoginScreen.tsx` | Все | Email + пароль |
| Регистрация | `RegisterScreen.tsx` | Все | Создание аккаунта |
| Регистрация бизнеса | `BusinessRegisterScreen.tsx` | Бизнес | Аккаунт продавца |
| Восстановление пароля | `ForgotPasswordScreen.tsx` | Все | Email для сброса |
| Сброс пароля | `ResetPasswordScreen.tsx` | Все | Новый пароль по ссылке |
| PIN-экран | `AppPinScreen.tsx` | Все | Разблокировка PIN/биометрией |
| Смена PIN | `ChangePinScreen.tsx` | Все | Банковский стиль: 3 шага |
| **Главная** | `HomeScreen.tsx` | Покупатель | Рекомендации, баннеры, акции |
| Категории | `CategoriesScreen.tsx` | Покупатель | Каталог категорий |
| Подкатегории | `SubCategoryScreen.tsx` | Покупатель | Товары категории |
| Список товаров | `ProductListScreen.tsx` | Покупатель | Фильтры, сортировка |
| Товар | `ProductScreen.tsx` | Покупатель | Карточка, история цен |
| Поиск | `SearchScreen.tsx` | Покупатель | Полнотекстовый поиск |
| Корзина | `CartScreen.tsx` | Покупатель | Товары, qty, итог |
| Избранное | `FavoritesScreen.tsx` | Покупатель | Сохранённые товары |
| Заказы | `OrdersScreen.tsx` | Покупатель | История с цветными статусами |
| Детали заказа | `OrderDetailScreen.tsx` | Покупатель | Позиции, статус, сумма |
| Оплата | `PaymentScreen.tsx` | Покупатель | Подтверждение и оплата |
| Профиль | `ProfileScreen.tsx` | Покупатель | Данные, настройки, выход |
| Личные данные | `PersonalDataScreen.tsx` | Покупатель | Редактирование имени |
| Аналитика | `AnalyticsScreen.tsx` | Покупатель | ML-графики + прогноз бюджета |
| Акции | `PromotionsScreen.tsx` | Покупатель | Товары со скидками, бейджи |
| Умные покупки | `SmartShoppingScreen.tsx` | Покупатель | AI-подборка товаров |
| Чатбот | `ChatbotScreen.tsx` | Покупатель | AI-ассистент (Gemini 2.0) |
| Сканер | `ScanScreen.tsx` | Покупатель | Камера для штрих-кода |
| Магазин | `StoreScreen.tsx` | Покупатель | Страница магазина |
| Карта | `MapScreen.tsx` | Покупатель | Расположение магазинов |
| Бизнес-панель | `BusinessDashboard.tsx` | Бизнес | Статистика продаж |
| Инвентарь | `BusinessInventoryScreen.tsx` | Бизнес | Складские остатки |
| Добавить товар | `AddProductScreen.tsx` | Бизнес | Форма нового товара |
| Заказы (бизнес) | `BusinessOrdersScreen.tsx` | Бизнес | Входящие заказы |
| Детали заказа (бизнес) | `BusinessOrderDetailScreen.tsx` | Бизнес | Детали + смена статуса |

### Дизайн-система

| Цвет | Hex | Назначение |
|------|-----|------------|
| Teal | `#1A9A88` | Основной акцент (кнопки, иконки) |
| Gold | `#D97706` | Цены, вторичный акцент |
| Dark Navy | `#0A2E2C` | Тёмные header |
| Midnight | `#081C1B` | Фон тёмных экранов (PIN, Chat) |
| Ivory | `#F0F8F7` | Светлые фоны |
| Text Dark | `#0A1E1D` | Текст на светлых экранах |

**Анимации (react-native-reanimated):**
- `FadeIn`, `FadeInDown` — появление элементов при загрузке
- `withSpring` — пружинный эффект кнопок
- Скролл-анимации прозрачности header

**Positioning под notch/камеру:**  
Хук `useHeaderLayout.ts` вычисляет отступы динамически:
```ts
const { topPadding, contentTopOffset } = useHeaderLayout();
// topPadding = insets.top + 12
// contentTopOffset = topPadding + 42
```

---

## База данных

### Flyway-миграции

| Файл | Содержимое |
|------|-----------|
| `V1__init.sql` | Схема: `users`, `stores`, `categories`, `products`, `carts`, `cart_items`, `orders`, `order_items` |
| `V2__schema_redesign.sql` | `favorites`, `price_history`, полнотекстовые индексы `tsvector`, constraints |
| `V3__seed_data.sql` | Тестовые данные: 3 магазина, 10+ категорий, ~30 товаров с ценами в тенге |

### Основная схема

```
users (id, email, password_hash, full_name, phone, role)
  │
  ├── carts (user_id, store_id)
  │     └── cart_items (cart_id, product_id, quantity)
  │
  ├── orders (user_id, store_id, total_amount, status)
  │     └── order_items (order_id, product_id, quantity, unit_price)
  │
  └── favorites (user_id, product_id)

stores (id, name, address, owner_id → users)
  └── inventory (store_id, product_id, quantity)

categories (id, name, icon)
  └── products (id, name, description, price, barcode, category_id)
        └── price_history (product_id, store_id, price, recorded_at)
```

**Статусы заказов:** `PENDING` → `PROCESSING` → `COMPLETED` / `CANCELLED`

**Роли пользователей:** `CUSTOMER` | `BUSINESS` | `ADMIN`

---

## Тестирование

### Backend (JUnit 5 + Spring Boot Test)

```powershell
cd Backend/project
.\gradlew.bat test
```

HTML-отчёт: `build/reports/tests/test/index.html`

Тест-классы:

| Класс | Что тестирует |
|-------|--------------|
| `AuthServiceTest` | Регистрация, логин, генерация JWT |
| `AuthControllerTest` | HTTP-эндпоинты `/api/auth/**` |
| `OrderServiceTest` | Оформление заказа, статусы |
| `OrderAdminServiceTest` | Управление заказами администратором |
| `AnalyticsServiceTest` | Расчёт аналитики расходов |
| `RecommendationServiceTest` | Алгоритм рекомендаций |
| `PriceInsightServiceTest` | История цен |
| `StoreServiceTest` | Магазины и инвентарь |
| `StatsServiceTest` | Бизнес-статистика |
| `InventoryAdminServiceTest` | Управление инвентарём |
| `CatalogPublicControllerTest` | Публичные эндпоинты каталога |

### Frontend (Jest)

```powershell
cd frontend
npm test
```

---

## Установка JDK 17

Проект **жёстко требует JDK 17**. Не 11, не 21, не 22 — только 17.

```
GradleException: Backend must run with JDK 17. Current runtime: 21.0.x
```

### Windows

1. Скачайте JDK 17 с [Adoptium](https://adoptium.net/) (бесплатно)
2. Установите и задайте `JAVA_HOME` (PowerShell от администратора):
   ```powershell
   setx JAVA_HOME "C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot" /M
   ```
3. Перезапустите терминал и проверьте:
   ```powershell
   & "$env:JAVA_HOME\bin\java" -version
   # java version "17.x.x"
   ```

### macOS

```bash
brew install --cask temurin@17
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
echo 'export JAVA_HOME=$(/usr/libexec/java_home -v 17)' >> ~/.zshrc
```

### Linux (Ubuntu/Debian)

```bash
sudo apt install openjdk-17-jdk
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
echo 'export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64' >> ~/.bashrc
```

> Если в `PATH` стоит другая `java` — это не важно. Gradle использует `JAVA_HOME`.

---

## Типовые проблемы

### «Backend must run with JDK 17»

Проверьте и переназначьте `JAVA_HOME`:
```powershell
& "$env:JAVA_HOME\bin\java" -version
```

### Android эмулятор не видит backend (connection refused)

Android эмулятор обращается к хосту через `10.0.2.2`. Уже настроено в `frontend/src/config/api.ts`.  
Для **физического устройства** укажите IP вашего компьютера в той же конфигурации.

### `ANDROID_HOME` не установлен

```powershell
setx ANDROID_HOME "$env:LOCALAPPDATA\Android\Sdk" /M
```

### Приложение крашится: `libreactnative.so not found`

В `frontend/android/gradle.properties` должно быть:
```properties
reactNativeArchitectures=arm64-v8a,x86_64
```
Затем:
```powershell
cd frontend/android && .\gradlew.bat clean
cd .. && npm run android
```

### Порт 8080 или 55432 занят

```powershell
netstat -ano | findstr :8080
taskkill /PID <PID> /F
```

### Ошибки Gradle-кэша

```powershell
cd Backend/project
.\gradlew.bat --stop
.\gradlew.bat clean
```

### Metro не подхватывает изменения

```powershell
cd frontend
npm start -- --reset-cache
```

### AI-чатбот не отвечает

Убедитесь, что `GEMINI_API_KEY` задан в `ai-service/.env`.  
Получить ключ бесплатно: https://aistudio.google.com/app/apikey

---

## Лицензия

MIT License — свободное использование и модификация.

---

<p align="center">
  Разработано командой <strong>Darshad &amp; Dimash</strong> · Казахстан 🇰🇿
</p>
