const functions = require("firebase-functions");

exports.sendTelegramMessage = functions.https.onRequest(async (req, res) => {
    // Настройки CORS, чтобы ваш сайт мог свободно отправлять данные
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    // Обработка предварительного запроса от браузера
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }

    try {
        // Достаем ключи из нашего файла .env
        const token = process.env.TELEGRAM_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;
        
        // Получаем данные, которые пришли из формы на сайте
        // (Предполагаем, что в форме есть поля name, phone и message)
        const { name, phone, message } = req.body;
        
        // Формируем красивый текст для Telegram
        const text = `🎉 Новая заявка с сайта!\n\n👤 Имя: ${name || 'Не указано'}\n📞 Телефон: ${phone || 'Не указан'}\n💬 Сообщение: ${message || 'Нет'}`;

        // Отправляем запрос напрямую на серверы Telegram (работает в Node.js 18+)
        const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: text
            })
        });

        if (!response.ok) {
            throw new Error('Ошибка при отправке в Telegram');
        }

        // Отвечаем сайту, что всё прошло успешно
        res.status(200).json({ success: true, message: "Заявка успешно отправлена!" });
        
    } catch (error) {
        console.error("Ошибка:", error);
        res.status(500).json({ success: false, error: "Внутренняя ошибка сервера" });
    }
});