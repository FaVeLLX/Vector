const functions = require("firebase-functions");

exports.sendBookingNotification = functions.https.onCall(async (data, context) => {
    const token = process.env.TELEGRAM_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
        throw new functions.https.HttpsError('failed-precondition', 'Telegram не настроен на сервере');
    }

    const name = (data?.name || 'Не указано').toString().trim();
    const phone = (data?.phone || 'Не указан').toString().trim();
    const email = (data?.email || 'Не указан').toString().trim();
    const subject = (data?.subject || '-').toString().trim();
    const grade = (data?.grade || '-').toString().trim();
    const lessonType = (data?.lesson_type || '-').toString().trim();
    const message = (data?.message || 'Нет').toString().trim();

    const text = `🎉 Новая заявка с сайта!\n\n👤 Имя: ${name}\n📧 Email: ${email}\n📞 Телефон: ${phone}\n📚 Предмет: ${subject}\n🏫 Класс: ${grade}\n🎯 Тип: ${lessonType}\n💬 Сообщение: ${message}`;

    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            text: text
        })
    });

    if (!response.ok) {
        throw new functions.https.HttpsError('internal', 'Ошибка при отправке в Telegram');
    }

    return { success: true };
});
