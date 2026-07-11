exports.handler = async function(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let data;
  try {
    data = JSON.parse(event.body || "{}");
  } catch (err) {
    return { statusCode: 400, body: "Invalid JSON" };
  }

  const token = process.env.TELEGRAM_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    return { statusCode: 500, body: "Telegram config missing" };
  }

  const name = (data.name || "Не указано").toString().trim();
  const phone = (data.phone || "Не указан").toString().trim();
  const email = (data.email || "Не указан").toString().trim();
  const subject = (data.subject || "-").toString().trim();
  const grade = (data.grade || "-").toString().trim();
  const lessonType = (data.lesson_type || "-").toString().trim();
  const message = (data.message || "Нет").toString().trim();

  const text = `🎉 <b>Новая заявка на урок</b>\n\n👤 Имя: ${name}\n📧 Email: ${email}\n📞 Телефон: ${phone}\n📚 Предмет: ${subject}\n🏫 Класс: ${grade}\n🎯 Тип: ${lessonType}\n💬 Сообщение: ${message}`;

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      message_thread_id: 3
    })
  });

  const body = await response.text();
  if (!response.ok) {
    return { statusCode: 500, body };
  }

  return { statusCode: 200, body: JSON.stringify({ success: true }) };
};
