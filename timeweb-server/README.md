# Vector Timeweb Server

Небольшой Express-сервер с двумя маршрутами для отправки Telegram-уведомлений
(регистрация и заявка на урок). Это замена firebase-functions `onCall`-функций
из `functions/index.js`, специально адаптированная под обычный Node-хостинг
(Timeweb Cloud Apps).

## Структура

- `server.js` — сам сервер (Express, слушает `0.0.0.0:PORT`)
- `package.json` / `package-lock.json` — зависимости

## Куда положить в репозитории

Разместите эту папку как отдельную директорию в корне репозитория, например:

```
your-repo/
├── index.html
├── style.css
├── functions/        <- остаётся как есть, для firebase deploy
├── netlify/          <- остаётся как есть, для Netlify
└── timeweb-server/   <- эта папка, для Timeweb
```

## Настройка в панели Timeweb (App Platform)

1. Тип приложения: **Node.js / Express** (обычный шаблон, без Dockerfile).
2. Путь до директории проекта: `timeweb-server`
3. Переменные окружения (Настройки приложения → Переменные):
   - `TELEGRAM_TOKEN` — токен вашего Telegram-бота
   - `TELEGRAM_CHAT_ID` — ID чата/группы для уведомлений
   - `TELEGRAM_BASE_CHAT_ID` — (опционально) ID чата, если он отличается от TELEGRAM_CHAT_ID
   - `ALLOWED_ORIGIN` — домен вашего сайта, например `https://vectorschool.ru` (чтобы разрешить CORS только с него; если не задать — разрешены запросы с любого домена)
4. Путь проверки состояния (healthcheck): `/health`
5. Команда запуска: подставится автоматически (`pm2 start --no-daemon server.js`), ничего менять не нужно — файл называется `server.js`, это одно из имён, которые Timeweb ищет по умолчанию.

## Что нужно поменять на фронтенде (index.html)

Сейчас, судя по коду, уведомления отправляются через Firebase Client SDK
(`httpsCallable`), который умеет говорить именно с `firebase-functions`
`onCall`-функциями. Новый сервер — обычный REST-эндпоинт, поэтому вызовы нужно
заменить на простой `fetch`.

Было (примерно):
```js
const sendRegistrationNotification = httpsCallable(functions, 'sendRegistrationNotification');
await sendRegistrationNotification({ name, email, userId });
```

Стало:
```js
const TIMEWEB_API_BASE = 'https://ваш-домен-или-IP-на-timeweb'; // подставьте после деплоя

async function sendRegistrationNotification(payload) {
    const res = await fetch(`${TIMEWEB_API_BASE}/sendRegistrationNotification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Ошибка отправки уведомления');
    }
    return res.json();
}
```

Аналогично для `sendBookingNotification`.

`TIMEWEB_API_BASE` — это технический домен или привязанный домен приложения,
который появится на вкладке «Дашборд» после успешного деплоя.

## Локальная проверка перед деплоем

```bash
cd timeweb-server
npm install
TELEGRAM_TOKEN=xxx TELEGRAM_CHAT_ID=xxx node server.js
```

Затем:
```bash
curl -X POST http://localhost:8080/sendRegistrationNotification \
  -H "Content-Type: application/json" \
  -d '{"name":"Тест","email":"test@example.com","userId":"123"}'
```
