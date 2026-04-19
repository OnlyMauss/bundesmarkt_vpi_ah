import os
import json
import asyncio
import threading
from flask import Flask, request, jsonify
import discord
from discord.ext import commands

# ===== НАСТРОЙКИ =====
DISCORD_BOT_TOKEN = os.environ.get("DISCORD_BOT_TOKEN", "MTQ5NTEyOTQ3NzY0NTA3NDcyMg.GYCO-C.Vv1_DtZEZO7bvjFqzQXFAXuH5f8tPqHeUk2EmQ")
OWNER_USER_ID = int(os.environ.get("OWNER_USER_ID", 660410238582784010))

# Папка для временных файлов (можно использовать общую с Node.js, но лучше отдельную)
TEMP_DIR = "/tmp/discord_receipts"
os.makedirs(TEMP_DIR, exist_ok=True)

app = Flask(__name__)

# ===== DISCORD БОТ =====
intents = discord.Intents.default()
intents.dm_messages = True
bot = commands.Bot(command_prefix="!", intents=intents)

@bot.event
async def on_ready():
    print(f"✅ Python бот {bot.user} запущен и готов отправлять чеки.")

async def send_receipt(filename: str, content: str, target_user_id: int = None):
    """Отправляет файл указанному пользователю (по умолчанию владельцу)."""
    await bot.wait_until_ready()
    user_id = target_user_id if target_user_id else OWNER_USER_ID
    try:
        user = await bot.fetch_user(user_id)
        if not user:
            print(f"Пользователь {user_id} не найден")
            return
        filepath = os.path.join(TEMP_DIR, filename)
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)
        with open(filepath, "rb") as f:
            await user.send(f"📄 **Новый заказ**", file=discord.File(f, filename))
        os.remove(filepath)
        print(f"Файл {filename} отправлен {user.name}")
    except Exception as e:
        print(f"Ошибка отправки: {e}")

# Эндпоинт для приёма данных от Node.js
@app.route("/send-receipt", methods=["POST"])
def send_receipt_endpoint():
    data = request.get_json()
    filename = data.get("filename")
    content = data.get("content")
    owner_id = data.get("owner_discord_id")
    if not filename or not content:
        return jsonify({"error": "Missing filename or content"}), 400

    target_id = int(owner_id) if owner_id else OWNER_USER_ID
    # Запускаем асинхронную отправку
    asyncio.run_coroutine_threadsafe(send_receipt(filename, content, target_id), bot.loop)
    return jsonify({"status": "ok"}), 200

# Запуск Flask в отдельном потоке
def run_flask():
    port = int(os.environ.get("PYTHON_PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False, use_reloader=False)

if __name__ == "__main__":
    if DISCORD_BOT_TOKEN == "ВАШ_ТОКЕН" or OWNER_USER_ID == 0:
        print("❌ Ошибка: задайте DISCORD_BOT_TOKEN и OWNER_USER_ID в переменных окружения")
        exit(1)
    # Запускаем Flask в фоне
    threading.Thread(target=run_flask, daemon=True).start()
    # Запускаем бота
    bot.run(DISCORD_BOT_TOKEN)