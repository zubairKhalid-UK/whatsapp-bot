const express = require("express");
const { Client, LocalAuth } = require("whatsapp-web.js");

// ================= EXPRESS SERVER =================
const app = express();
const PORT = process.env.PORT || 3000;

let latestQR = ""; // store latest QR

// Home route
app.get("/", (req, res) => {
  res.send("✅ WhatsApp bot is running! Go to /qr to scan.");
});

// QR route (shows QR in browser)
app.get("/qr", (req, res) => {
  if (!latestQR) {
    return res.send("⏳ QR not generated yet. Please refresh...");
  }

  res.send(`
    <h2>Scan QR Code</h2>
    <p>Open WhatsApp → Linked Devices → Link a device</p>
    <img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${latestQR}" />
  `);
});

// Start server
app.listen(PORT, () => {
  console.log(`🌐 Server running on port ${PORT}`);
});

// ================= WHATSAPP BOT =================
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  },
});

// Capture QR and store it
client.on("qr", (qr) => {
  console.log("📱 QR received, open /qr in browser");
  latestQR = qr;
});

// Bot ready
client.on("ready", () => {
  console.log("✅ Bot is ready!");
  latestQR = ""; // clear QR after login
});

// Keywords
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

    console.log("📩 From:", chat.name, "| Message:", msg.body);

    // Only groups
    if (!chat.isGroup) return;

    // Target specific group
    if (!chat.name.includes("Wembley, MK Dons,Reading, Northampton 🏟️")) return;

    const text = msg.body.toLowerCase();
    const matched = KEYWORDS.some((word) => text.includes(word));

    if (matched) {
      console.log("✅ Keyword matched → reacting 👍");

      await new Promise((resolve) => setTimeout(resolve, 2000));

      await msg.react("👍");

      if (msg.author) {
        await client.sendMessage(msg.author, "available");
      }
    }
  } catch (error) {
    console.error("❌ Error:", error);
  }
});

// Start bot
client.initialize();
