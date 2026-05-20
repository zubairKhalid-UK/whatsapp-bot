const express = require("express");
const { Client, LocalAuth } = require("whatsapp-web.js");
const QRCode = require("qrcode");

const app = express();

// ✅ Use fallback port
const PORT = process.env.PORT || 3000;

// Store latest QR
let latestQR = "";
let isBotReady = false; // 👈 ADD THIS LINE

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
  // If already logged in, show success and stop refreshing!
  if (isBotReady) {
    return res.send(`
      <div style="text-align: center; font-family: sans-serif; margin-top: 50px;">
        <h1 style="color: #25D366;">🟢 Bot is Connected & Active!</h1>
        <p>Your WhatsApp automation is running 24/7 on your AlmaLinux VPS.</p>
        <p>Monitoring Group: <b>Wembley, MK Dons, Reading, Northampton 🏟️</b></p>
      </div>
    `);
  }

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
    defaultViewport: null,
    protocolTimeout: 60000, // 60s timeout for slow connections
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
  isBotReady = true; // 👈 SET READY FLAG
});

// If the bot gets disconnected later, reset the flag
client.on("disconnected", () => {
  console.log("❌ Bot disconnected");
  isBotReady = false;
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

const TARGET_GROUPS = ["Wembley, MK Dons,Reading, Northampton 🏟️"];

// Listen for messages
client.on("message", async (msg) => {
  try {
    const chat = await msg.getChat();
    // Only groups
    if (!chat.isGroup) return;
    // Only target groups
    if (!TARGET_GROUPS.some((name) => chat.name.includes(name))) return;

    // console.log("📩 From:", chat.name, "| Message:", msg.body);

    // Target specific group
    // if (!chat.name.includes("Wembley, MK Dons,Reading, Northampton 🏟️")) return;

    const text = msg.body.toLowerCase();
    const matched = KEYWORDS.some((word) => text.includes(word));

    if (matched) {
      console.log("✅ Keyword matched → reacting 👍");

      await new Promise((resolve) => setTimeout(resolve, 1370)); // 1.37s delay for natural reaction

      await msg.react("👍");

      // Reply privately
      if (msg.author) {
        await msg.reply("available", msg.author);

        // await client.sendMessage(msg.author, "available");
        // quotedMessageId: msg.id._serialized; // 👈 This explicitly quotes the group text in the private chat
      }
    }
  } catch (error) {
    console.error("❌ Error:", error);
  }
});

// Start bot
client.initialize();
