const express = require("express");
const { Client, LocalAuth } = require("whatsapp-web.js");
const QRCode = require("qrcode");

const app = express();

// ✅ Use fallback port
const PORT = process.env.PORT || 3000;

// Store latest QR
let latestQR = "";

// -------------------- Website Routes --------------------

// Home page
app.get("/", (req, res) => {
  res.send(`
    <h1>✅ Node Website + WhatsApp Bot Running!</h1>
    <p>Go to <a href="/qr">/qr</a> to scan WhatsApp QR code.</p>
  `);
});

// QR page
app.get("/qr", async (req, res) => {
  if (!latestQR) {
    return res.send(`
      <h2>⏳ QR not ready yet</h2>
      <p>Refresh in a few seconds...</p>
      <meta http-equiv="refresh" content="5">
    `);
  }

  try {
    const qrImage = await QRCode.toDataURL(latestQR);

    res.send(`
      <h2>📱 Scan QR Code</h2>
      <p>Open WhatsApp → Linked Devices → Link a Device</p>
      <img src="${qrImage}" />
      <p>QR refreshes every 10 seconds</p>
      <meta http-equiv="refresh" content="10">
    `);
  } catch (err) {
    res.send("❌ Failed to generate QR");
  }
});

// Start server
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

// QR event
client.on("qr", (qr) => {
  console.log("📱 QR received → open /qr");
  latestQR = qr;
});

// Ready event
client.on("ready", () => {
  console.log("✅ WhatsApp bot is ready!");
  latestQR = ""; // clear QR after login
});

// Optional: debug QR string
client.on("qr", (qr) => {
  console.log("RAW QR:", qr.substring(0, 50) + "...");
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

      // Reply privately
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
