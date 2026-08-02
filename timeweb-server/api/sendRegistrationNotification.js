// ==========================================================
// Vercel Serverless Function
// POST /api/sendRegistrationNotification
// Тело запроса: { name, email, userId }
//
// Переменные окружения — см. sendBookingNotification.js
// ==========================================================

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const token = process.env.TELEGRAM_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    const apiBase = process.env.TELEGRAM_API_BASE || 'https://api.telegram.org';

    if (!token || !chatId) {
        console.error('TELEGRAM_TOKEN или TELEGRAM_CHAT_ID не заданы в переменных окружения');
        return res.status(500).json({ error: 'Telegram не настроен на сервере' });
    }

    const body = req.body || {};
    const name = (body.name || 'Не указано').toString().trim();
    const email = (body.email || 'Не указан').toString().trim();
    const userId = (body.userId || 'Не указан').toString().trim();

    const text = `🆕 <b>Новая регистрация</b>\n\n👤 Имя: ${name}\n📧 Email: ${email}\n🆔 UID: ${userId}`;

    try {
        const response = await fetch(`${apiBase}/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text,
                parse_mode: 'HTML',
                message_thread_id: 2, // топик "Регистрация"
            }),
        });

        if (!response.ok) {
            const errBody = await response.text();
            console.error(`Telegram error ${response.status}: ${errBody}`);
            return res.status(502).json({ error: 'Не удалось отправить уведомление о регистрации. Повторите позже.' });
        }

        return res.status(200).json({ success: true });
    } catch (err) {
        console.error('Ошибка отправки уведомления о регистрации в Telegram:', err);
        return res.status(502).json({ error: 'Не удалось отправить уведомление о регистрации. Повторите позже.' });
    }
}