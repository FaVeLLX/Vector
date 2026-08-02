export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const token = process.env.TELEGRAM_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    const data = req.body;

    const fullMessage = `
🚀 <b>Новая заявка с сайта!</b>

<b>Имя:</b> ${data?.name || '-'}
<b>Контакты:</b> ${data?.phone || '-'} / ${data?.email || '-'}
<b>Класс:</b> ${data?.grade || '-'}
<b>Тип занятия:</b> ${data?.lesson_type || '-'}

<b>Пожелания:</b> 
${data?.message || 'Нет'}
    `.trim();

    try {
        const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, text: fullMessage, parse_mode: "HTML" })
        });
        
        if (!response.ok) throw new Error('Telegram API error');
        return res.status(200).json({ success: true });
    } catch (error) {
        return res.status(500).json({ error: 'Failed to send message' });
    }
}