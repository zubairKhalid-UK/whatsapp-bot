require("dotenv").config();
const express = require("express");
const session = require("express-session");
const path = require("path");
const QRCode = require("qrcode");

const { getQR, isReady } = require("./bot");

const app = express();

// ---------------- MIDDLEWARE ----------------

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session config (safer defaults)
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
    },
  }),
);

// Static files
app.use("/public", express.static(path.join(__dirname, "public")));

// ---------------- AUTH MIDDLEWARE ----------------

function requireLogin(req, res, next) {
  if (!req.session.loggedIn) {
    // IMPORTANT: return JSON for API routes instead of redirecting
    if (req.path.startsWith("/api")) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    return res.redirect("/login");
  }
  next();
}

// ---------------- LOGIN ----------------

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "views/login.html"));
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (
    username === process.env.ADMIN_USER &&
    password === process.env.ADMIN_PASS
  ) {
    req.session.loggedIn = true;
    return res.redirect("/dashboard");
  }

  return res.status(401).send("❌ Invalid login");
});

// ---------------- DASHBOARD ----------------

app.get("/dashboard", requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, "views/dashboard.html"));
});

// ---------------- API ----------------

// Bot status
app.get("/api/status", requireLogin, (req, res) => {
  res.json({
    ready: isReady(),
  });
});

// QR code
app.get("/api/qr", requireLogin, async (req, res) => {
  try {
    const qr = getQR();

    if (!qr) {
      return res.json({ qr: null });
    }

    const qrImageData = await QRCode.toDataURL(qr);
    return res.json({ qr: qrImageData });
  } catch (err) {
    console.error("QR error:", err);
    return res.status(500).json({ qr: null, error: "Failed to generate QR" });
  }
});

// ---------------- LOGOUT ----------------

app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

// ---------------- START SERVER ----------------

app.listen(process.env.PORT, () => {
  console.log("🌐 Server running on port", process.env.PORT);
});
