const express = require("express");
const { Client, LocalAuth } = require("whatsapp-web.js");

// ================= EXPRESS SERVER =================
const app = express();

// ✅ IMPORTANT: use ONLY Hostinger port
const PORT = process.env.PORT;

if (!PORT) {
  console.error("❌ PORT not assigned by hosting");
  process.exit(1);
}

let latestQR = "";

// Home route
app.get("/", (req, res) => {
  res.send("✅ WhatsApp bot is running! Go to /qr to scan.");
});

// QR route
app.get("/qr", (req, res) => {
  if (!latestQR) {
    return res.send("⏳ QR not ready yet. Refresh in a few seconds...");
  }

  res.send(`
    <h2>Scan QR Code</h2>
    <p>WhatsApp → Linked Devices → Link a Device</p>
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
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
  },
});

// QR event
client.on("qr", (qr) => {
  console.log("📱 QR received → open /qr");
  latestQR = qr;
});

// Ready event
client.on("ready", () => {
  console.log("✅ Bot is ready!");
  latestQR = "";
});

// Keywords
const KEYWORDS = [
  "wembly",
  "wembley",
  "shift available wembley stadium",
  "shift available wembly stadium",
];

// Message listener
client.on("message", async (msg) => {
  try {
    const chat = await msg.getChat();

    console.log("📩 From:", chat.name, "| Message:", msg.body);

    if (!chat.isGroup) return;

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
