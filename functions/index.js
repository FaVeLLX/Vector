const functions = require("firebase-functions");

require('express')

const getTelegramConfig = () => {
    const config = functions.config && functions.config();
    const token = process.env.TELEGRAM_TOKEN || config?.telegram?.token;
    const chatId = process.env.TELEGRAM_CHAT_ID || config?.telegram?.chat_id || config?.telegram?.chatid;
    const baseChatId = process.env.TELEGRAM_BASE_CHAT_ID || config?.telegram?.base_chat_id || config?.telegram?.chat;

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

exports.sendRegistrationNotification = functions.https.onCall(async (data, context) => {
    const { token, chatId, baseChatId } = getTelegramConfig();
    const targetChatId = baseChatId || chatId;

    if (!targetChatId) {
        throw new functions.https.HttpsError('failed-precondition', 'Telegram chat ID не настроен на сервере');
    }

    const name = (data?.name || 'Не указано').toString().trim();
    const email = (data?.email || 'Не указан').toString().trim();
    const userId = (data?.userId || 'Не указан').toString().trim();

    const text = `🆕 <b>Новая регистрация</b>\n\n👤 Имя: ${name}\n📧 Email: ${email}\n🆔 UID: ${userId}`;

    try {
        await sendTelegramMessage({
            token,
            chatId: targetChatId,
            text,
            messageThreadId: 2
        });
    } catch (err) {
        console.error('Ошибка отправки уведомления о регистрации в Telegram:', err);
        throw new functions.https.HttpsError('internal', 'Не удалось отправить уведомление о регистрации. Повторите позже.', err.message || err);
    }

    return { success: true };
});

exports.sendBookingNotification = functions.https.onCall(async (data, context) => {
    const { token, chatId, baseChatId } = getTelegramConfig();
    const targetChatId = baseChatId || chatId;

    if (!targetChatId) {
        throw new functions.https.HttpsError('failed-precondition', 'Telegram chat ID не настроен на сервере');
    }

    const name = (data?.name || 'Не указано').toString().trim();
    const phone = (data?.phone || 'Не указан').toString().trim();
    const email = (data?.email || 'Не указан').toString().trim();
    const subject = (data?.subject || '-').toString().trim();
    const grade = (data?.grade || '-').toString().trim();
    const lessonType = (data?.lesson_type || '-').toString().trim();
    const message = (data?.message || 'Нет').toString().trim();

    const text = `🎉 <b>Новая заявка на урок</b>\n\n👤 Имя: ${name}\n📧 Email: ${email}\n📞 Телефон: ${phone}\n📚 Предмет: ${subject}\n🏫 Класс: ${grade}\n🎯 Тип: ${lessonType}\n💬 Сообщение: ${message}`;

    try {
        await sendTelegramMessage({
            token,
            chatId: targetChatId,
            text,
            messageThreadId: 3
        });
    } catch (err) {
        console.error('Ошибка отправки уведомления о заявке в Telegram:', err);
        throw new functions.https.HttpsError('internal', 'Не удалось отправить уведомление о заявке. Повторите позже.', err.message || err);
    }

    return { success: true };
});

const functions = require("firebase-functions");
const express = require("express");

// ==========================================================
// Прокси до Telegram Bot API через Firebase Cloud Functions.
//
// Зачем нужен: сервер на Timeweb не может напрямую достучаться
// до api.telegram.org (сетевая блокировка/таймаут). Google Cloud
// такой блокировки не имеет, поэтому эта функция просто
// пересылает запрос дальше в Telegram и возвращает ответ как есть.
//
// После деплоя (firebase deploy --only functions) Firebase покажет
// URL вида:
//   https://us-central1-<project-id>.cloudfunctions.net/telegramProxy
//
// Дальше просто:
//   TELEGRAM_API_BASE=https://us-central1-<project-id>.cloudfunctions.net/telegramProxy
// в переменных окружения на Timeweb — остальной код server.js
// менять не нужно, он уже это поддерживает.
// ==========================================================

const app = express();
app.use(express.json());

app.all("*", async (req, res) => {
    try {
        // req.path здесь будет вида /bot<TOKEN>/sendMessage —
        // ровно то же самое, что ожидает настоящий Telegram API
        const telegramUrl = `https://api.telegram.org${req.path}`;

        const telegramResponse = await fetch(telegramUrl, {
            method: req.method,
            headers: { "Content-Type": "application/json" },
            body: req.method === "GET" || req.method === "HEAD"
                ? undefined
                : JSON.stringify(req.body),
        });

        const contentType = telegramResponse.headers.get("content-type") || "application/json";
        const body = await telegramResponse.text();

        res.status(telegramResponse.status);
        res.set("Content-Type", contentType);
        res.send(body);
    } catch (err) {
        console.error("Ошибка прокси до Telegram:", err);
        res.status(502).json({ error: "Не удалось связаться с Telegram API" });
    }
});

exports.telegramProxy = functions.https.onRequest(app);
