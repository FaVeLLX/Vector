# Vector School — статический сайт онлайн-школы

## Состав проекта (всё лежит в одной папке)
- `index.html` — главная страница: услуги, форма записи, авторизация, кабинеты ученика и учителя
- `theory.html` — шпаргалка «Площади фигур» (открывается из кабинета при наличии доступа)
- `style.css` — стили
- `обложка.png` — логотип
- `hero-bg.png` — фон главного блока
- `firestore.rules` — правила безопасности базы (вставить в консоль Firebase, **в сам сайт не входит**)

## Как запустить локально
ES-модули и Firebase не работают через двойной клик (file://). Нужен локальный сервер:

```bash
cd vector-school
python3 -m http.server 8000
```
Открыть в браузере: http://localhost:8000

## Что сделать в Firebase (один раз)
1. Консоль Firebase → Firestore Database → вкладка **Rules** → вставить содержимое `firestore.rules` → **Publish**.
2. Назначить себя учителем: Firestore → коллекция `users` → свой документ → поле `role` = `admin`.
3. Перевыпустить токен Telegram-бота в @BotFather (`/revoke`) — старый засвечен в коде.

## Как выложить в интернет (вариант под твой стек — Firebase Hosting)
```bash
npm install -g firebase-tools
firebase login
cd vector-school
firebase init hosting    # public dir = текущая папка (.), single-page app = No
firebase deploy
```
Альтернативы без консоли: GitHub Pages, Netlify, Vercel — просто закинуть папку.

## На заметку
- `hero-bg.png` весит ~11 МБ — это очень много для фона, страница будет грузиться медленно. Стоит сжать до ~200–400 КБ (например, через squoosh.app).
