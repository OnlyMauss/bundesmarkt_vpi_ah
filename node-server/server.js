const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Папка для временных файлов (если нужно сохранять локально)
const TEMP_DIR = path.join(__dirname, 'temp_orders');
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR);

// Адрес Python микросервиса (может быть localhost или отдельный хост)
const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:5000/send-receipt';

// Эндпоинт, который вызывает сайт
app.post('/order', async (req, res) => {
    const { discord, country, comment, cart, total, rawText } = req.body;

    // Валидация
    if (!discord || !country || !cart || total === undefined) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // Формируем текст чека (можно также сохранить как файл, но отправим сразу в Python)
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safeNick = discord.replace(/[#@]/g, '_');
    const filename = `receipt_${timestamp}_${safeNick}.txt`;
    const content = `===== ЧЕК ПОКУПКИ =====
Дата: ${new Date().toLocaleString()}
Discord: ${discord}
Страна доставки: ${country}
Комментарий: ${comment}
Товары:
${rawText || 'Смотрите данные в корзине'}
ИТОГО: ${total} DM
===========================`;

    // Опционально сохраняем файл локально (на случай, если Python недоступен)
    const localFilePath = path.join(TEMP_DIR, filename);
    fs.writeFileSync(localFilePath, content, 'utf8');

    // Отправляем запрос в Python-сервис
    try {
        await axios.post(PYTHON_SERVICE_URL, {
            filename: filename,
            content: content,
            discord_user_id: null,  // можно передать, если нужно отправить не владельцу, а конкретному пользователю
            owner_discord_id: process.env.OWNER_DISCORD_ID  // передаём ID владельца из переменной окружения
        });
        console.log(`Заказ от ${discord} передан в Python-сервис`);
        res.json({ status: 'ok', message: 'Order received, receipt will be sent' });
    } catch (err) {
        console.error('Ошибка при вызове Python сервиса:', err.message);
        // Даже если Python не ответил, говорим пользователю, что заказ принят (файл сохранён локально)
        res.status(500).json({ error: 'Order saved locally but failed to send to Discord. Admin notified.' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Node.js сервер запущен на порту ${PORT}`);
});