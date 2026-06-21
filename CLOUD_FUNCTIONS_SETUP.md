# ☁️ Развёртывание Cloud Functions для Vector School

**Статус:** ✅ Код готов к развёртыванию  
**Время установки:** ~15-20 минут

---

## 📋 ШАГ 1: Подготовка

### 1.1 Убедись, что у тебя есть:
- ✅ Node.js (версия 18+) — проверить: `node -v`
- ✅ npm — проверить: `npm -v`
- ✅ Firebase CLI — установить: `npm install -g firebase-tools`

### 1.2 Проверить установку Firebase CLI:
```bash
firebase --version
# Должно показать версию, например: 13.0.0
```

### 1.3 Авторизация в Firebase:
```bash
firebase login
# Откроется браузер — логинься в Google аккаунт, который привязан к Firebase проекту
```

---

## 🔐 ШАГ 2: Установка Telegram переменных окружения

**ВАЖНО:** Перед развёртыванием нужно установить Telegram токен и Chat ID.

### 2.1 Перевыпустить Telegram токен (КРИТИЧНО!)

Старый токен был виден в исходнике. Нужно создать новый:

1. Откройте Telegram: [@BotFather](https://t.me/BotFather)
2. Отправьте команду: `/revoke`
3. Выберите бота `VectorSchoolSupp`
4. Подтвердите отзыв токена
5. Отправьте: `/token`
6. Скопируйте новый токен (выглядит как: `123456789:ABCDEFg...`)

### 2.2 Получить Chat ID (тема форума для заявок)

Chat ID у вас уже есть: `-1003612200808`

### 2.3 Установить переменные в Firebase

Перейди в папку проекта и выполни:

```bash
cd /Users/maksimurcenkov/Documents/GitHub/Vector

# Установка Telegram конфигурации
firebase functions:config:set telegram.token="СЮДА_ВСТАВЬ_НОВЫЙ_ТОКЕН" telegram.chat_id="-1003612200808"

# Пример:
firebase functions:config:set telegram.token="123456789:ABCDEFghijklmnopqrstuvwxyz" telegram.chat_id="-1003612200808"
```

### 2.4 Проверить установку:
```bash
firebase functions:config:get
# Должно показать что-то вроде:
# {
#   "telegram": {
#     "token": "123456789:ABCDEFg...",
#     "chat_id": "-1003612200808"
#   }
# }
```

---

## 📦 ШАГ 3: Установка зависимостей

```bash
cd functions
npm install

# Должно установить:
# - firebase-admin
# - firebase-functions
# - node-fetch
```

---

## ✅ ШАГ 4: Тестирование локально (опционально)

```bash
cd /Users/maksimurcenkov/Documents/GitHub/Vector
firebase emulators:start --only functions

# Будет запущен эмулятор на http://localhost:5001
# Для теста можно вызвать функцию через эмулятор
```

Чтобы остановить, нажмите Ctrl+C.

---

## 🚀 ШАГ 5: Развёртывание на Firebase Hosting

### 5.1 Развёртывание только функций (быстрее):
```bash
firebase deploy --only functions
```

### 5.2 Или развёртывание всего (функции + hosting):
```bash
firebase deploy
```

### 5.3 Ожидание...
```
✔ Deploy complete!

Project Console: https://console.firebase.google.com/project/vector-7122d/overview
```

---

## 📊 ШАГ 6: Проверка развёртывания

### 6.1 Проверить логи функций:
```bash
firebase functions:log
```

### 6.2 Проверить в консоли Firebase:
- Открыть: [Firebase Console](https://console.firebase.google.com)
- Выбрать проект: `vector-7122d`
- Functions → Dashboard
- Должны быть видны:
  - ✅ `sendBookingNotification` 
  - ✅ `sendRegistrationNotification`

### 6.3 Проверить в консоли браузера:
- Открыть сайт: `http://localhost:8000`
- Нажать F12 → Console
- Должны быть видны сообщения (без ошибок)

---

## 🔄 ШАГ 7: Тестирование форм

### 7.1 Тест регистрации:
1. Открыть сайт
2. Нажать "Войти"
3. Выбрать "Регистрация"
4. Заполнить форму и отправить
5. **Проверить:** Должно прийти сообщение в Telegram (@VectorSchoolSupp)

### 7.2 Тест бронирования:
1. Открыть сайт
2. Прокрутить вниз до "Запишитесь на пробный урок"
3. Заполнить форму и нажать "Отправить заявку"
4. **Проверить:** Должна показаться сообщение "✅ Спасибо! Заявка отправлена."
5. **Проверить в Telegram:** Должно прийти сообщение в группу

---

## 🛠️ РЕШЕНИЕ ПРОБЛЕМ

### Проблема: "Error: Could not authenticate with Firebase Credentials"
**Решение:** 
```bash
firebase logout
firebase login
```

### Проблема: "Function 'sendBookingNotification' not found"
**Решение:** 
```bash
firebase deploy --only functions
# Дождитесь завершения развёртывания
```

### Проблема: "Telegram token not set"
**Решение:**
```bash
firebase functions:config:set telegram.token="твой_токен" telegram.chat_id="-1003612200808"
firebase deploy --only functions
```

### Проблема: Сообщения не приходят в Telegram
**Решение:**
1. Проверить токен: `firebase functions:config:get`
2. Проверить Chat ID правильный
3. Посмотреть логи: `firebase functions:log`
4. Проверить, бот добавлен в группу

### Проблема: "CORS error" в консоли браузера
**Решение:** Это не проблема, функции работают через Firebase SDK, а не HTTP запросы

---

## 📝 КОМАНДЫ КОТОРЫЕ МОГУТ ПРИГОДИТЬСЯ

```bash
# Просмотр конфигурации
firebase functions:config:get

# Просмотр логов (реал-тайм)
firebase functions:log

# Удаление функций
firebase functions:delete sendBookingNotification

# Переразвёртывание всего
firebase deploy

# Проверить статус проекта
firebase status
```

---

## ✨ ВСЕ ГОТОВО!

После развёртывания:
- ✅ Форма бронирования отправляет заявки в Telegram через Cloud Function
- ✅ Регистрация отправляет уведомление о новом пользователе
- ✅ Telegram токен скрыт на сервере (не виден в исходнике)
- ✅ Rate limiting защищает от spam
- ✅ Все данные сохраняются в Firestore

---

## 📞 ЕСЛИ ЧТО-ТО НЕ РАБОТАЕТ

1. Проверить консоль браузера (F12 → Console)
2. Посмотреть логи функций: `firebase functions:log`
3. Проверить конфигурацию: `firebase functions:config:get`
4. Попробовать переразвернуть: `firebase deploy --only functions`

---

**Подготовлено:** 2025-06-21  
**Версия:** 1.0
