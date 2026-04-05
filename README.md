# Aqyldy Sauda Sebeti

Мобильное приложение «Умная Торговая Корзина» — система для покупок в магазинах Казахстана. Сканирование штрих-кодов, каталог товаров, корзина, избранное, заказы.

**Стек:** React Native 0.83 (Android) + Spring Boot 3.3.5 (Java 17) + PostgreSQL 16

---

## Содержание

- [Архитектура проекта](#архитектура-проекта)
- [Требования](#требования)
- [Установка JDK 17](#установка-jdk-17-обязательно)
- [Быстрый старт](#быстрый-старт)
- [Пошаговый запуск (вручную)](#пошаговый-запуск-вручную)
- [API эндпоинты](#api-эндпоинты)
- [Структура проекта](#структура-проекта)
- [База данных](#база-данных)
- [Типовые проблемы и решения](#типовые-проблемы-и-решения)

---

## Архитектура проекта

```
┌────────────────────┐     HTTP (8080)     ┌─────────────────────┐     JDBC (55432)     ┌──────────────┐
│  React Native App  │ ──────────────────> │  Spring Boot API    │ ──────────────────> │  PostgreSQL  │
│  (Android)         │ <────────────────── │  (порт 8080)        │ <────────────────── │  (Docker)    │
│  Metro: 8081       │      JSON           │  Swagger: /swagger  │      SQL             │  порт 55432  │
└────────────────────┘                     └─────────────────────┘                     └──────────────┘
```

- **Frontend:** React Native 0.83, TypeScript, Zustand (состояние), React Navigation, Axios
- **Backend:** Spring Boot 3.3.5, Spring Security + JWT, Spring Data JPA, Flyway (миграции)
- **БД:** PostgreSQL 16 в Docker-контейнере

---

## Требования

| Компонент | Версия | Для чего |
|-----------|--------|----------|
| **Java JDK** | **17 (только 17!)** | Backend + Android Gradle сборка |
| **Node.js** | 20+ | React Native, Metro bundler |
| **npm** | 10+ | Зависимости фронтенда |
| **Docker Desktop** | Любая | PostgreSQL локально |
| **Android Studio** | SDK 36, Build Tools 36 | Android SDK, эмулятор |

> **Подробная установка всех компонентов → [SETUP.md](SETUP.md)**

---

## Установка JDK 17 (ОБЯЗАТЕЛЬНО)

Проект **жёстко требует JDK 17**. Не 11, не 21, не 22 — **только 17**.

Оба Gradle-проекта (backend и android) проверяют версию при запуске и **выбрасывают ошибку**, если JDK не 17:

```
GradleException: Backend must run with JDK 17. Current runtime: 21.0.10
```

### Установка

1. Скачайте JDK 17:
   - Oracle: https://www.oracle.com/java/technologies/downloads/#java17
   - Adoptium (бесплатно): https://adoptium.net/

2. Установите и выставите `JAVA_HOME`:

   **Windows (PowerShell от администратора):**
   ```powershell
   setx JAVA_HOME "C:\Program Files\Java\jdk-17" /M
   ```

   **macOS:**
   ```bash
   export JAVA_HOME=$(/usr/libexec/java_home -v 17)
   ```

   **Linux:**
   ```bash
   export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
   ```

3. Перезапустите терминал и проверьте:
   ```powershell
   & "$env:JAVA_HOME\bin\java" -version
   # Должно быть: java version "17.x.x"
   ```

> **Важно:** если в `PATH` стоит другая java (например 21) — это нормально. Gradle использует `JAVA_HOME`, а не `PATH`.

### Где проверяется версия

| Файл | Строка проверки |
|------|----------------|
| `Backend/project/build.gradle` | `if (JavaVersion.current() != JavaVersion.VERSION_17)` |
| `frontend/android/build.gradle` | `if (JavaVersion.current() != JavaVersion.VERSION_17)` |
| `frontend/android/app/build.gradle` | `sourceCompatibility JavaVersion.VERSION_17` / `jvmTarget = '17'` |

---

## Быстрый старт

### 1. Клонирование

```powershell
git clone https://github.com/D-Arshad-Dazai-Dimash/Aqyldy-Sauda-Sebeti.git
cd "Aqyldy-Sauda-Sebeti"
```

### 2. Проверка окружения

```powershell
.\start-dev.ps1
```

Скрипт проверит Java 17, Docker, Node.js, Android SDK и выведет инструкции.

### 3. Запуск (4 отдельных терминала PowerShell)

| Терминал | Команда | Что делает |
|----------|---------|------------|
| **1** | `.\start-db.ps1` | PostgreSQL в Docker (порт 55432) |
| **2** | `.\start-backend.ps1` | Spring Boot API (порт 8080) |
| **3** | `.\start-frontend-metro.ps1` | Metro bundler (порт 8081) |
| **4** | `.\start-frontend-android.ps1` | Сборка и запуск Android-приложения |

> Запускайте строго в этом порядке. Подождите 3-5 секунд между БД и Backend.

**Описание всех скриптов → [SCRIPTS.md](SCRIPTS.md)**

---

## Пошаговый запуск (вручную)

### 1. База данных (PostgreSQL)

```powershell
docker compose up -d
docker compose ps          # Проверить статус (должно быть "healthy")
```

Параметры подключения:

| Параметр | Значение |
|----------|----------|
| Host | `localhost` |
| Port | `55432` |
| Database | `dbaqyldy` |
| User | `aqsa` |
| Password | `aqyldysebet123` |

### 2. Backend (Spring Boot)

```powershell
cd Backend/project

# Переменные окружения (PowerShell)
$env:DB_URL = "jdbc:postgresql://localhost:55432/dbaqyldy"
$env:DB_USER = "aqsa"
$env:DB_PASS = "aqyldysebet123"
$env:JWT_SECRET = "dev-secret-at-least-32-chars-long!!"

# Запуск
.\gradlew.bat bootRun
```

После запуска:
- API: http://localhost:8080
- Swagger UI: http://localhost:8080/swagger
- API Docs: http://localhost:8080/api-docs

### 3. Frontend (React Native Android)

```powershell
cd frontend
npm install       # Только при первом запуске или после git pull
```

**Терминал 1 — Metro bundler:**
```powershell
npm start
```

**Терминал 2 — Android app:**
```powershell
npm run android
```

> Для Android эмулятора необходим `ANDROID_HOME`:
> ```powershell
> setx ANDROID_HOME "%LOCALAPPDATA%\Android\Sdk"
> ```

---

## API эндпоинты

Все эндпоинты доступны через Swagger UI: http://localhost:8080/swagger

### Авторизация

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/api/auth/register` | Регистрация пользователя |
| POST | `/api/auth/login` | Логин, возвращает JWT токен |

### Пользователь

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/me` | Профиль текущего пользователя |
| PUT | `/api/me` | Обновление профиля |

### Каталог (публичный)

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/categories` | Список категорий |
| GET | `/api/products` | Список товаров (фильтры, поиск, пагинация) |
| GET | `/api/products/{id}` | Товар по ID |
| GET | `/api/products/barcode/{barcode}` | Товар по штрих-коду |

### Каталог (админ)

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/api/admin/products` | Создать товар |
| PUT | `/api/admin/products/{id}` | Обновить товар |
| DELETE | `/api/admin/products/{id}` | Удалить товар |

### Корзина

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/cart` | Содержимое корзины |
| POST | `/api/cart/items` | Добавить товар в корзину |
| PUT | `/api/cart/items/{itemId}` | Изменить количество |
| DELETE | `/api/cart/items/{itemId}` | Удалить товар из корзины |
| DELETE | `/api/cart` | Очистить корзину |

### Заказы

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/api/orders/checkout` | Оформить заказ из корзины |
| GET | `/api/orders/my` | Мои заказы |
| GET | `/api/orders/{id}` | Детали заказа |

### Избранное

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/favorites` | Список избранного |
| GET | `/api/favorites/ids` | ID избранных товаров |
| POST | `/api/favorites/{productId}` | Добавить в избранное |
| DELETE | `/api/favorites/{productId}` | Убрать из избранного |

### Магазины

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/stores` | Список магазинов |
| GET | `/api/stores/{id}` | Магазин по ID |
| GET | `/api/stores/{id}/inventory` | Инвентарь магазина |
| GET | `/api/stores/{id}/products` | Товары магазина |

### Сканирование

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/api/scan` | Сканирование штрих-кода |

---

## Структура проекта

```
Aqyldy-Sauda-Sebeti/
├── Backend/project/                 # Spring Boot API
│   ├── src/main/java/com/darshad/project/
│   │   ├── auth/                    # Регистрация, логин, JWT
│   │   ├── cart/                    # Корзина покупателя
│   │   ├── catalog/                 # Товары и категории
│   │   │   ├── category/
│   │   │   ├── product/
│   │   │   └── pricehistory/
│   │   ├── exception/               # Глобальная обработка ошибок
│   │   ├── favorite/                # Избранные товары
│   │   ├── order/                   # Оформление заказов
│   │   ├── scan/                    # Сканирование штрих-кодов
│   │   ├── security/                # Spring Security + JWT фильтры
│   │   ├── store/                   # Магазины и инвентарь
│   │   └── user/                    # Профиль пользователей
│   ├── src/main/resources/
│   │   ├── application.yml          # Основной конфиг
│   │   ├── application-dev.yml      # Dev-профиль (активный по умолчанию)
│   │   └── db/migration/            # Flyway миграции (V1, V2, V3)
│   ├── build.gradle                 # Зависимости + проверка JDK 17
│   └── gradlew.bat                  # Gradle wrapper
│
├── frontend/                        # React Native (Android)
│   ├── src/
│   │   ├── api/                     # HTTP-клиент (Axios) для каждого модуля
│   │   ├── app/                     # Навигация (React Navigation)
│   │   ├── screens/                 # Экраны приложения (18 экранов)
│   │   ├── store/                   # Zustand-сторы (auth, cart, favorites)
│   │   ├── components/              # Переиспользуемые компоненты
│   │   ├── config/                  # API URL конфигурация
│   │   ├── constants/               # Моковые данные, категории
│   │   ├── types/                   # TypeScript типы
│   │   └── assets/                  # Иконки и изображения
│   ├── android/                     # Android-специфичные настройки Gradle
│   ├── package.json
│   └── App.tsx                      # Точка входа
│
├── docker-compose.yml               # PostgreSQL 16
├── start-dev.ps1                    # Проверка окружения
├── start-db.ps1                     # Запуск БД
├── start-backend.ps1                # Запуск backend
├── start-frontend-metro.ps1         # Запуск Metro bundler
├── start-frontend-android.ps1       # Запуск Android app
├── clean-gradle.ps1                 # Очистка Gradle кэшей
├── check-java.ps1                   # Проверка JDK 17
├── SETUP.md                         # Установка зависимостей
└── SCRIPTS.md                       # Описание скриптов
```

### Экраны приложения

| Экран | Файл | Описание |
|-------|------|----------|
| Логин | `LoginScreen.tsx` | Вход по email/пароль |
| Регистрация | `RegisterScreen.tsx` | Создание аккаунта |
| Главная | `HomeScreen.tsx` | Основной экран |
| Каталог | `CategoriesScreen.tsx` | Категории товаров |
| Подкатегории | `SubCategoryScreen.tsx` | Товары в подкатегориях |
| Список товаров | `ProductListScreen.tsx` | Товары с фильтрами |
| Товар | `ProductScreen.tsx` | Карточка товара |
| Поиск | `SearchScreen.tsx` | Поиск по товарам |
| Корзина | `CartScreen.tsx` | Корзина покупок |
| Избранное | `FavoritesScreen.tsx` | Избранные товары |
| Заказы | `OrdersScreen.tsx` | История заказов |
| Детали заказа | `OrderDetailScreen.tsx` | Детали конкретного заказа |
| Профиль | `ProfileScreen.tsx` | Профиль пользователя |
| Сканер | `ScanScreen.tsx` | Сканирование штрих-кода камерой |
| Магазин | `StoreScreen.tsx` | Страница магазина |
| Бизнес-панель | `BusinessDashboard.tsx` | Панель продавца |
| Инвентарь | `BusinessInventoryScreen.tsx` | Управление инвентарём |
| Добавить товар | `AddProductScreen.tsx` | Создание нового товара |

---

## База данных

### Миграции (Flyway)

Миграции запускаются автоматически при старте backend.

| Файл | Что делает |
|------|------------|
| `V1__init.sql` | Начальная схема: users, stores, categories, products, carts, cart_items, orders, order_items |
| `V2__schema_redesign.sql` | Доработки: favorites, price_history, полнотекстовый поиск, индексы, новые поля |
| `V3__seed_data.sql` | Тестовые данные: 3 магазина (Magnum, Small, FixPrice), 10 категорий, ~30 товаров с ценами в тенге |

### Схема (основные таблицы)

```
users  ←──┐
           ├── carts ──── cart_items ──── products
           ├── orders ─── order_items ─── products
           └── favorites ──────────────── products

stores ──── inventory ──── products

categories ──── products (many-to-many через product_categories)

price_history ──── products
```

---

## Типовые проблемы и решения

### «Backend must run with JDK 17»

`JAVA_HOME` указывает не на JDK 17. Проверьте:

```powershell
& "$env:JAVA_HOME\bin\java" -version
```

Если не 17 — переустановите или переназначьте `JAVA_HOME`.

### Приложение крашится на эмуляторе (libreactnative.so not found)

Сборка не включает архитектуру эмулятора. В `frontend/android/gradle.properties` должно быть:

```
reactNativeArchitectures=arm64-v8a,x86_64
```

После изменения: `cd frontend/android && .\gradlew.bat clean`, затем `npm run android`.

### Android эмулятор не видит backend

Android эмулятор не знает про `localhost` хоста. Используйте `10.0.2.2:8080` — это уже настроено в `frontend/src/config/api.ts`.

Для физического телефона — укажите IP вашей машины в `DEVICE_URL` в том же файле.

### `ANDROID_HOME` не установлен

```powershell
setx ANDROID_HOME "%LOCALAPPDATA%\Android\Sdk"
```

Перезапустите терминал.

### Порт 8080 или 55432 занят

```powershell
# Найти процесс на порту
netstat -ano | findstr :8080

# Убить процесс
taskkill /PID <pid> /F
```

Или измените порт в конфиге (`application-dev.yml` / `docker-compose.yml`).

### Ошибки Gradle / кэша после обновления

```powershell
.\clean-gradle.ps1
```

Или вручную:

```powershell
# Backend
cd Backend/project
.\gradlew.bat --stop
.\gradlew.bat clean

# Frontend Android
cd frontend/android
.\gradlew.bat --stop
.\gradlew.bat clean
```

### Metro не подхватывает изменения

```powershell
cd frontend
npm start -- --reset-cache
```
