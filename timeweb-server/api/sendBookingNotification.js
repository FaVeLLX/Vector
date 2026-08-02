// ==========================================================
// Vercel Serverless Function
// POST /api/sendBookingNotification
// Тело запроса: { name, email, phone, subject, grade, lesson_type, message }
//
// Переменные окружения (задаются в Vercel: Settings -> Environment Variables):
//   TELEGRAM_TOKEN       — токен бота
//   TELEGRAM_CHAT_ID     — ID группы (например -1001234567890)
//   TELEGRAM_API_BASE    — необязательно, на случай если api.telegram.org
//                          вдруг окажется недоступен напрямую с инфраструктуры
//                          Vercel (адрес прокси, если понадобится)
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
    const phone = (body.phone || 'Не указан').toString().trim();
    const subject = (body.subject || '-').toString().trim();
    const grade = (body.grade || '-').toString().trim();
    const lessonType = (body.lesson_type || '-').toString().trim();
    const message = (body.message || 'Нет').toString().trim();

    const text = `🎉 <b>Новая заявка на урок</b>\n\n👤 Имя: ${name}\n📧 Email: ${email}\n📞 Телефон: ${phone}\n📚 Предмет: ${subject}\n🏫 Класс: ${grade}\n🎯 Тип: ${lessonType}\n💬 Сообщение: ${message}`;

    try {
        const response = await fetch(`${apiBase}/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text,
                parse_mode: 'HTML',
                message_thread_id: 3, // топик "Заявки"
            }),
        });

        if (!response.ok) {
            const errBody = await response.text();
            console.error(`Telegram error ${response.status}: ${errBody}`);
            return res.status(502).json({ error: 'Не удалось отправить уведомление о заявке. Повторите позже.' });
        }

        return res.status(200).json({ success: true });
    } catch (err) {
        console.error('Ошибка отправки уведомления о заявке в Telegram:', err);
        return res.status(502).json({ error: 'Не удалось отправить уведомление о заявке. Повторите позже.' });
    }
}