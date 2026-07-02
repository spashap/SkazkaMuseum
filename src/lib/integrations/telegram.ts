// Telegram notifications to managers. Inert until TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID
// are set in .env — so nothing breaks before the bot is created.
export async function notifyTelegram(text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.log('[telegram] not configured — skipping. Message was:', text);
    return false;
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    });
    return res.ok;
  } catch (e) {
    console.error('[telegram] send failed', e);
    return false;
  }
}
