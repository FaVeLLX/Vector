const express = require('express');
const cors = require('cors');

const app = express();

// Разрешаем запросы с фронтенда (в проде лучше сузить до конкретного домена сайта
// через переменную окружения ALLOWED_ORIGIN — см. блок ниже)
const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
app.use(cors({ origin: allowedOrigin }));
app.use(express.json());

// ==========================================================
// Конфигурация Telegram — задаётся переменными окружения
// в панели Timeweb (Настройки приложения -> Переменные)
// ==========================================================
const getTelegramConfig = () => {
    const token = process.env.TELEGRAM_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    const baseChatId = process.env.TELEGRAM_BASE_CHAT_ID;
    return { token, chatId, baseChatId };
};

const sendTelegramMessage = async ({ token, chatId, text, messageThreadId }) => {
    if (!token || !chatId) {
        throw new Error('Telegram token or chat ID is not configured');
    }

    const payload = {
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
    };

    if (messageThreadId !== undefined) {
        payload.message_thread_id = messageThreadId;
    }

    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const body = await response.text();
        throw new Error(`Telegram error ${response.status}: ${body}`);
    }

    return response.json();
};

// ==========================================================
// Health-check — используйте этот путь в поле
// «Путь проверки состояния» в настройках Timeweb
// ==========================================================
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// ==========================================================
// POST /sendRegistrationNotification
// Тело запроса: { name, email, userId }
// ==========================================================
app.post('/sendRegistrationNotification', async (req, res) => {
    const { token, chatId, baseChatId } = getTelegramConfig();
    const targetChatId = baseChatId || chatId;

    if (!targetChatId) {
        return res.status(500).json({ error: 'Telegram chat ID не настроен на сервере' });
    }

    const name = (req.body?.name || 'Не указано').toString().trim();
    const email = (req.body?.email || 'Не указан').toString().trim();
    const userId = (req.body?.userId || 'Не указан').toString().trim();

    const text = `🆕 <b>Новая регистрация</b>\n\n👤 Имя: ${name}\n📧 Email: ${email}\n🆔 UID: ${userId}`;

    try {
        await sendTelegramMessage({
            token,
            chatId: targetChatId,
            text,
            messageThreadId: 2
        });
        res.json({ success: true });
    } catch (err) {
        console.error('Ошибка отправки уведомления о регистрации в Telegram:', err);
        res.status(500).json({ error: 'Не удалось отправить уведомление о регистрации. Повторите позже.' });
    }
});

// ==========================================================
// POST /sendBookingNotification
// Тело запроса: { name, phone, email, subject, grade, lesson_type, message }
// ==========================================================
app.post('/sendBookingNotification', async (req, res) => {
    const { token, chatId, baseChatId } = getTelegramConfig();
    const targetChatId = baseChatId || chatId;

    if (!targetChatId) {
        return res.status(500).json({ error: 'Telegram chat ID не настроен на сервере' });
    }

    const name = (req.body?.name || 'Не указано').toString().trim();
    const phone = (req.body?.phone || 'Не указан').toString().trim();
    const email = (req.body?.email || 'Не указан').toString().trim();
    const subject = (req.body?.subject || '-').toString().trim();
    const grade = (req.body?.grade || '-').toString().trim();
    const lessonType = (req.body?.lesson_type || '-').toString().trim();
    const message = (req.body?.message || 'Нет').toString().trim();

    const text = `🎉 <b>Новая заявка на урок</b>\n\n👤 Имя: ${name}\n📧 Email: ${email}\n📞 Телефон: ${phone}\n📚 Предмет: ${subject}\n🏫 Класс: ${grade}\n🎯 Тип: ${lessonType}\n💬 Сообщение: ${message}`;

    try {
        await sendTelegramMessage({
            token,
            chatId: targetChatId,
            text,
            messageThreadId: 3
        });
        res.json({ success: true });
    } catch (err) {
        console.error('Ошибка отправки уведомления о заявке в Telegram:', err);
        res.status(500).json({ error: 'Не удалось отправить уведомление о заявке. Повторите позже.' });
    }
});

// ==========================================================
// Запуск сервера — обязательно на 0.0.0.0, иначе Timeweb
// не сможет проксировать внешние запросы на контейнер
// ==========================================================
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
