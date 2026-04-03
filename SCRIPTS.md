# Скрипты запуска проекта

Все эти скрипты находятся в корне репозитория (`c:\Users\esken\Desktop\Aqyldy Sauda Sebeti`).

## 🔍 Проверка окружения

### `start-dev.ps1`
**Главный скрипт проверки окружения**

Проверяет наличие и версии:
- Java 17
- Docker
- Node.js 20+
- Android SDK

Выводит пошаговые инструкции для запуска всех компонентов.

```powershell
.\start-dev.ps1
```

**Запустите первым!**

---

### `check-java.ps1`
**Проверка Java 17**

Вспомогательный скрипт, проверяет, что установлена именно Java 17.

Используется автоматически другими скриптами.

---

## 🚀 Запуск компонентов

### `start-db.ps1`
**Запуск PostgreSQL в Docker**

Включает Docker Compose и поднимает БД локально.

```powershell
.\start-db.ps1
```

**Нужно запустить первым!** Подождите 3-5 секунд перед запуском backend.

---

### `start-backend.ps1`
**Запуск Spring Boot backend**

Создает переменные окружения и запускает сервер на `http://localhost:8080`.

```powershell
.\start-backend.ps1
```

Требует: Java 17, PostgreSQL (от `start-db.ps1`)

---

### `start-frontend-metro.ps1`
**Запуск Metro bundler для React Native**

Metro — это build tool для React Native. Его нужно запустить перед сборкой приложения.

```powershell
.\start-frontend-metro.ps1
```

Требует: Node.js 20+, npm install (выполняется автоматически)

---

### `start-frontend-android.ps1`
**Сборка и запуск Android приложения**

Собирает React Native приложение и запускает его на эмуляторе.

```powershell
.\start-frontend-android.ps1
```

Требует: Android Studio, эмулятор, Metro (от `start-frontend-metro.ps1`)

---

## 🧹 Обслуживание

### `clean-gradle.ps1`
**Очистка Gradle кэша**

Останавливает Gradle daemons и удаляет build директории для обоих проектов.

```powershell
.\clean-gradle.ps1
```

Используйте если:
- После обновления зависимостей при странных ошибках
- Gradle "зависает"
- Изменения в build.gradle не применяются

---

## 📋 Порядок запуска

**Откройте 4-5 новых PowerShell окон и выполните по порядку:**

1. **Окно 1 — Проверка:**
   ```powershell
   .\start-dev.ps1
   ```
   Убедитесь, что всё зелёное.

2. **Окно 2 — БД:**
   ```powershell
   .\start-db.ps1
   ```
   Подождите, пока не увидите "PostgreSQL запущен".

3. **Окно 3 — Backend:**
   ```powershell
   .\start-backend.ps1
   ```
   Подождите, пока не увидите "Tomcat started".

4. **Окно 4 — Metro:**
   ```powershell
   .\start-frontend-metro.ps1
   ```
   Должен вывести "Metro waiting for..." (ждёт команд).

5. **Окно 5 — Android App:**
   ```powershell
   .\start-frontend-android.ps1
   ```
   Стартует эмулятор и устанавливает приложение.

---

## 🎯 Рекомендуемый workflow

### Первый запуск
```powershell
.\start-dev.ps1                # Проверяем окружение
.\clean-gradle.ps1            # Очищаем кэш (первый раз всегда)
```

Потом откройте 4 новых окна и следуйте пунктам 2–5 выше.

### Последующие запуски
Просто откройте 4 окна и выполните scripts 2–5.

### Если что-то сломалось
```powershell
.\clean-gradle.ps1            # Очищаем кэш
# Убейте все окна
# Начните заново с пункта 2
```

---

## ✅ Все готово!

Если у вас есть вопросы, проверьте:
- [README.md](README.md) — Полный гайд и troubleshooting
- [SETUP.md](SETUP.md) — Установка Java 17, Docker, Android SDK
