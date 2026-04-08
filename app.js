const express = require("express");
const { Client, LocalAuth } = require("whatsapp-web.js");

const app = express();

// ✅ Must use Hostinger-assigned port
const PORT = process.env.PORT;
if (!PORT) {
  console.error("❌ PORT not assigned by hosting");
  process.exit(1);
}

// Store QR code for browser display
let latestQR = "";

// -------------------- Website Routes --------------------

// Home page
app.get("/", (req, res) => {
  res.send(
    "<h1>✅ Node Website + WhatsApp Bot Running!</h1><p>Go to <a href='/qr'>/qr</a> to scan WhatsApp QR code.</p>",
  );
});

// QR code page
app.get("/qr", (req, res) => {
  if (!latestQR)
    return res.send("⏳ QR not ready yet. Refresh in a few seconds...");

  res.send(`
    <h2>Scan QR Code</h2>
    <p>Open WhatsApp → Linked Devices → Link a Device</p>
    <img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${latestQR}" />
  `);
});

// -------------------- Start Express Server --------------------
app.listen(PORT, () => {
  console.log(`🌐 Server running on port ${PORT}`);
});

// -------------------- WhatsApp Bot --------------------
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

// Capture QR code
client.on("qr", (qr) => {
  console.log("📱 QR received → open /qr in browser");
  latestQR = qr;
});

// Bot ready
client.on("ready", () => {
  console.log("✅ WhatsApp bot is ready!");
  latestQR = ""; // QR no longer needed after login
});

// Keywords to watch
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

      // Reply privately
      if (msg.author) await client.sendMessage(msg.author, "available");
    }
  } catch (error) {
    console.error("❌ Error:", error);
  }
});

// Start WhatsApp bot
client.initialize();
