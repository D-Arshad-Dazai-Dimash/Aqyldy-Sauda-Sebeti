# Настройка окружения для Aqyldy Sauda Sebeti

Эта инструкция для установки необходимых компонентов перед запуском проекта.

## 1️⃣ Java JDK 17 (ОБЯЗАТЕЛЬНО)

### Windows

1. Скачайте JDK 17 с [oracle.com](https://www.oracle.com/java/technologies/downloads/#java17) или [adoptium.net](https://adoptium.net/)
2. Установите в стандартное место (например, `C:\Program Files\Java\jdk-17`)
3. Выставьте переменную окружения `JAVA_HOME`:
   ```powershell
   setx JAVA_HOME "C:\Program Files\Java\jdk-17"
   ```
4. Перезагрузитесь или перезапустите PowerShell
5. Проверьте:
   ```powershell
   java -version
   ```
   Должно быть: `java version "17.x.x"`

### macOS

```bash
brew tap adoptopenjdk/openjdk
brew install adoptopenjdk17
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
```

### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install openjdk-17-jdk
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
```

---

## 2️⃣ Docker Desktop

Нужен для запуска PostgreSQL локально.

- **Windows:** https://docs.docker.com/desktop/install/windows-install/
- **macOS:** https://docs.docker.com/desktop/install/mac-install/
- **Linux:** https://docs.docker.com/engine/install/

Проверка:
```powershell
docker --version
docker ps
```

---

## 3️⃣ Node.js 20+

Нужен для фронтенда (React Native).

Скачайте с https://nodejs.org/ (LTS) или через пакетный менеджер:

```powershell
# Windows (Chocolatey)
choco install nodejs

# macOS (Homebrew)
brew install node

# Linux
sudo apt install nodejs npm
```

Проверка:
```powershell
node --version
npm --version
```

---

## 4️⃣ Android SDK + Emulator (для тестирования фронта)

### Windows

1. Установите Android Studio с https://developer.android.com/studio
2. Откройте SDK Manager (`Tools → SDK Manager`)
3. Установите:
   - Android SDK Platform 36+ 
   - Android SDK Build-Tools 36.0.0+
   - Android Emulator
4. Выставьте переменную:
   ```powershell
   setx ANDROID_HOME "C:\Users\YourUsernameHere\AppData\Local\Android\Sdk"
   ```
5. Перезагрузитесь

### macOS

```bash
brew install android-sdk
brew install android-emulator
export ANDROID_HOME=$HOME/Library/Android/sdk
```

### Linux

```bash
sudo apt install android-sdk
export ANDROID_HOME=~/Android/Sdk
```

Проверка эмулятора:
```powershell
emulator -list-avds
```

---

## 5️⃣ Проверка всего окружения

Запустите:
```powershell
cd "Aqyldy Sauda Sebeti"
.\start-dev.ps1
```

Если скрипт выведет что-то вроде:

```
[1/5] Проверяю Java 17... ✓ Java 17 найдена
[2/5] Проверяю Docker... ✓ Docker найден
[3/5] Проверяю Node.js... ✓ Node.js найден
[4/5] Проверяю Android SDK... ✓ ANDROID_HOME установлен
[5/5] Все компоненты проверены
```

— значит всё готово! 🎉

---

## 🚀 Запуск проекта

После успешной проверки следуйте инструкциям из `.\start-dev.ps1` или README.md:

```
Откройте 4 PowerShell окна и выполните:
1. .\start-db.ps1
2. .\start-backend.ps1
3. .\start-frontend-metro.ps1
4. .\start-frontend-android.ps1
```

---

## 🆘 Проблемы

### Java не найдена

```powershell
setx JAVA_HOME "C:\Program Files\Java\jdk-17"
# Перезагрузить PowerShell или компьютер
```

### Docker демон не запущен

```powershell
# Windows: Запустите Docker Desktop из меню Пуск

# Linux:
sudo systemctl start docker
```

### Port already in use

Backend использует **8080**, PostgreSQL **55432**.  
Если занято, остановите другие услуги или измените порт в конфигах.

### Android эмулятор не запускается

```powershell
emulator -list-avds  # Смотрим доступные AVD
emulator -avd <имя_авд>  # Запускаем конкретный
```

---

## ✅ Всё готово!

Теперь запустите `.\start-dev.ps1` и следуйте его инструкциям.

Если что-то не работает — проверьте раздел **Типовые проблемы** в [README.md](README.md).