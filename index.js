const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");

// Create client with session saving
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true, // 👈 runs in background (no browser window)
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  },
});

// Show QR code (only first time)
client.on("qr", (qr) => {
  console.log("📱 Scan this QR code:");
  qrcode.generate(qr, { small: true });
});

// When bot is ready
client.on("ready", () => {
  console.log("✅ Bot is ready!");
});

// Keywords (lowercase only)
const KEYWORDS = [
  "wembly",
  "wembley",
  "shift available wembley stadium",
  "shift available wembly stadium",
];

// Listen for messages
client.on("message", async (msg) => {
  try {
    const chat = await msg.getChat();

    // Debug log (VERY IMPORTANT)
    console.log("📩 From:", chat.name, "| Message:", msg.body);

    // Only allow groups
    if (!chat.isGroup) return;

    // // Target your group
    if (!chat.name.includes("Wembley, MK Dons,Reading, Northampton 🏟️")) return;

    const text = msg.body.toLowerCase();

    // Check keyword match
    const matched = KEYWORDS.some((word) => text.includes(word));

    if (matched) {
      console.log("✅ Keyword matched → reacting 👍");

      // Small delay to look human
      await new Promise((resolve) => setTimeout(resolve, 2000));

      await msg.react("👍");
      // await msg.reply("Wembley vibes! 🎉");
      client.sendMessage(msg.author, "available");
    }
  } catch (error) {
    console.error("❌ Error:", error);
  }
});

// Start bot
client.initialize();
