const { Client, LocalAuth } = require("whatsapp-web.js");
// const QRCode = require("qrcode");

let latestQR = "";
let ready = false;

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

// QR event - triggered when a new QR code is generated
client.on("qr", (qr) => {
  console.log("📱 QR received");
  latestQR = qr;
});

// Ready event - triggered when the bot is fully authenticated and ready
client.on("ready", () => {
  console.log("✅ Bot ready");
  ready = true;
  latestQR = null;
});

// If the bot gets disconnected later, reset the flag
client.on("disconnected", () => {
  console.log("❌ Bot disconnected");
  ready = false;
});

// Optional: debug QR string
client.on("qr", (qr) => {
  console.log("RAW QR:", qr.substring(0, 50) + "...");
});

client.initialize();

// ---------------- EXPORTS ----------------

function getQR() {
  return latestQR;
}

function isReady() {
  return ready;
}

// ---------------- BOT LOGIC ----------------

const KEYWORDS = ["Wembley Stadium", "HA9 0WS", "Aphis Signing Table at"];
const TARGET_GROUPS = ["Wembley, MK Dons,Reading, Northampton 🏟️"];

client.on("message", async (msg) => {
  try {
    const chat = await msg.getChat();
    if (!chat.isGroup) return;
    if (!TARGET_GROUPS.includes(chat.name)) return;
    if (!TARGET_GROUPS.some((name) => chat.name.includes(name))) return;

    const text = msg.body.toLowerCase();
    const match = KEYWORDS.some((word) => text.includes(word.toLowerCase()));

    if (match) {
      console.log("✅ Match found → reacting");
      await new Promise((resolve) => setTimeout(resolve, 1370)); // 1.37s delay for natural reaction

      await msg.react("👍");

      // Reply privately
      if (msg.author) {
        await msg.reply("available", msg.author); // This will reply in the group but tag the user

        // await client.sendMessage(msg.author, "available");
        // quotedMessageId: msg.id._serialized; // 👈 This explicitly quotes the group text in the private chat
      }
    }
  } catch (err) {
    console.error(err);
  }
});

module.exports = { getQR, isReady };
