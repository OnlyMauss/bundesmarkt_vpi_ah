import os
import json
from datetime import datetime
from flask import Flask, request, jsonify
import discord
from discord.ext import commands
import asyncio
import threading

# ===== КОНФИГУРАЦИЯ =====
DISCORD_BOT_TOKEN = "MTQ5NTEyOTQ3NzY0NTA3NDcyMg.GYCO-C.Vv1_DtZEZO7bvjFqzQXFAXuH5f8tPqHeUk2EmQ"
OWNER_USER_ID = 660410238582784010  # ID вашего аккаунта Discord (цифра)
CHANNEL_ID_FOR_LOG = 1237828308738244608  # можно указать ID канала для логов, но не обязательно

app = Flask(__name__)
bot = commands.Bot(command_prefix="!", intents=discord.Intents.default())

# Папка для временных файлов (Render позволяет запись в /tmp)
TMP_DIR = "/tmp/orders"
os.makedirs(TMP_DIR, exist_ok=True)

# Функция отправки файла в личку (вызывается асинхронно из Flask)
async def send_order_file_to_owner(content_text, filename):
    await bot.wait_until_ready()
    try:
        owner = await bot.fetch_user(OWNER_USER_ID)
        if owner is None:
            print("Не удалось найти пользователя с таким ID")
            return
        # Создаём временный файл
        filepath = os.path.join(TMP_DIR, filename)
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content_text)
        with open(filepath, "rb") as f:
            await owner.send(f"📄 **Новый заказ** от {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", file=discord.File(f, filename))
        os.remove(filepath)
        print(f"Файл {filename} отправлен владельцу")
    except Exception as e:
        print(f"Ошибка отправки: {e}")

# Эндпоинт для приёма заказов с сайта
@app.route("/order", methods=["POST"])
def order():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No JSON"}), 400

    discord_nick = data.get("discord", "Не указан")
    country = data.get("country", "Не указана")
    comment = data.get("comment", "")
    cart = data.get("cart", {})
    total = data.get("total", 0)
    raw_text = data.get("rawText", "")

    # Формируем содержимое чека
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"receipt_{timestamp}_{discord_nick.replace('#','_')}.txt"
    content = f"""===== ЧЕК ПОКУПКИ =====
Дата: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
Discord: {discord_nick}
Страна доставки: {country}
Комментарий: {comment}
Товары:
{raw_text if raw_text else "Смотрите данные в корзине"}
ИТОГО: {total} DM
===========================
"""
    # Асинхронно отправляем файл владельцу
    asyncio.run_coroutine_threadsafe(send_order_file_to_owner(content, filename), bot.loop)
    return jsonify({"status": "ok", "message": "Заказ принят, чек отправлен владельцу"}), 200

# Запуск Flask в отдельном потоке
def run_flask():
    app.run(host="0.0.0.0", port=8080)

if __name__ == "__main__":
    # Запускаем Flask в фоне
    threading.Thread(target=run_flask, daemon=True).start()
    # Запускаем бота
    bot.run(DISCORD_BOT_TOKEN)