const router = require("express").Router();
const passport = require("passport");
const crypto = require("crypto");
const User = require("../models/user");
const PasswordReset = require("../models/passwordReset");
const { getFirebaseAuth } = require("../config/firebaseAdmin");
const { sendPasswordOtpEmail } = require("../services/mailer");

const sha256 = value => crypto.createHash("sha256").update(value).digest("hex");

router.post("/signup", async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ message: "Username, email and password are required." });
    if (password.length < 8) return res.status(400).json({ message: "Password must be at least 8 characters." });

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ $or: [{ email: normalizedEmail }, { username }] });
    if (existing) return res.status(409).json({ message: "Username or email is already registered." });

    const user = await User.register(new User({ username, email: normalizedEmail, authProvider: "local" }), password);
    req.login(user, err => {
      if (err) return next(err);
      res.status(201).json({ user });
    });
  } catch (err) {
    next(err);
  }
});

router.post("/firebase/signup", async (req, res, next) => {
  try {
    const { idToken, username } = req.body;
    if (!idToken || !username?.trim()) {
      return res.status(400).json({ message: "Firebase token and username are required." });
    }

    const decoded = await getFirebaseAuth().verifyIdToken(idToken);
    const email = decoded.email?.toLowerCase().trim();
    if (!email) return res.status(400).json({ message: "A verified email account is required." });

    const cleanUsername = username.trim().slice(0, 40);
    const existing = await User.findOne({
      $or: [{ firebaseUid: decoded.uid }, { email }, { username: cleanUsername }]
    });

    if (existing) {
      if (existing.firebaseUid === decoded.uid) {
        return res.status(200).json({ user: existing, verificationRequired: !decoded.email_verified });
      }
      return res.status(409).json({ message: "Username or email is already registered." });
    }

    const user = await User.create({
      username: cleanUsername,
      email,
      firebaseUid: decoded.uid,
      authProvider: "firebase"
    });

    res.status(201).json({
      user,
      verificationRequired: !decoded.email_verified
    });
  } catch (err) {
    next(err);
  }
});

router.post("/firebase/session", async (req, res, next) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ message: "Firebase ID token is required." });

    const decoded = await getFirebaseAuth().verifyIdToken(idToken);
    const email = decoded.email?.toLowerCase().trim();

    if (!decoded.email_verified) {
      return res.status(403).json({
        message: "Please verify your email address before logging in."
      });
    }

    let user = await User.findOne({ firebaseUid: decoded.uid });

    if (!user && email) {
      user = await User.findOne({ email });
      if (user) {
        user.firebaseUid = decoded.uid;
        user.authProvider = user.authProvider === "local" ? "hybrid" : "firebase";
        await user.save();
      }
    }

    if (!user) {
      const fallbackUsername = (decoded.name || email?.split("@")[0] || `traveler_${decoded.uid.slice(0, 8)}`)
        .replace(/[^a-zA-Z0-9_]/g, "")
        .slice(0, 32) || `traveler_${decoded.uid.slice(0, 8)}`;

      let username = fallbackUsername;
      let suffix = 1;
      while (await User.exists({ username })) {
        username = `${fallbackUsername.slice(0, 26)}_${suffix++}`;
      }

      user = await User.create({
        username,
        email,
        firebaseUid: decoded.uid,
        authProvider: "firebase"
      });
    }

    await new Promise((resolve, reject) => {
      req.login(user, err => (err ? reject(err) : resolve()));
    });

    res.json({ user });
  } catch (err) {
    next(err);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const identifier = String(req.body.identifier || req.body.username || "").trim();
    if (!identifier || !req.body.password) {
      return res.status(400).json({ message: "Username/email and password are required." });
    }

    if (identifier.includes("@")) {
      const found = await User.findOne({ email: identifier.toLowerCase() });
      if (found?.username) req.body.username = found.username;
      else req.body.username = identifier;
    } else {
      req.body.username = identifier;
    }

    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info?.message || "Invalid username or password." });
      req.logIn(user, err => {
        if (err) return next(err);
        res.json({ user });
      });
    })(req, res, next);
  } catch (err) {
    next(err);
  }
});

router.post("/request-password-reset", async (req, res, next) => {
  try {
    const email = String(req.body.email || "").toLowerCase().trim();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ message: "Enter a valid email address." });
    }

    const user = await User.findOne({ email });

    if (user) {
      const otp = String(crypto.randomInt(100000, 1000000));
      const otpHash = sha256(otp);
      await PasswordReset.findOneAndUpdate(
        { email },
        {
          email,
          otpHash,
          otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
          attempts: 0,
          verifiedAt: null,
          resetTokenHash: null,
          resetTokenExpiresAt: null
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      await sendPasswordOtpEmail({ to: email, otp });
    }

    res.json({ message: "If an account exists for that email, a verification code has been sent." });
  } catch (err) {
    next(err);
  }
});

router.post("/verify-password-otp", async (req, res, next) => {
  try {
    const email = String(req.body.email || "").toLowerCase().trim();
    const otp = String(req.body.otp || "").trim();
    const record = await PasswordReset.findOne({ email });

    if (!record || !record.otpExpiresAt || record.otpExpiresAt < new Date()) {
      return res.status(400).json({ message: "The OTP is invalid or has expired." });
    }

    if (record.attempts >= 5) {
      return res.status(429).json({ message: "Too many incorrect attempts. Request a new OTP." });
    }

    if (sha256(otp) !== record.otpHash) {
      record.attempts += 1;
      await record.save();
      return res.status(400).json({ message: "Incorrect OTP." });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    record.verifiedAt = new Date();
    record.resetTokenHash = sha256(resetToken);
    record.resetTokenExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await record.save();

    res.json({ resetToken, message: "OTP verified. You can now choose a new password." });
  } catch (err) {
    next(err);
  }
});

router.post("/reset-password", async (req, res, next) => {
  try {
    const email = String(req.body.email || "").toLowerCase().trim();
    const resetToken = String(req.body.resetToken || "").trim();
    const newPassword = String(req.body.newPassword || "");

    if (newPassword.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters." });
    }

    const record = await PasswordReset.findOne({
      email,
      resetTokenHash: sha256(resetToken),
      verifiedAt: { $ne: null }
    });

    if (!record || !record.resetTokenExpiresAt || record.resetTokenExpiresAt < new Date()) {
      return res.status(400).json({ message: "Your reset session is invalid or expired. Request a new OTP." });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Unable to reset this account." });

    if (user.firebaseUid) {
      await getFirebaseAuth().updateUser(user.firebaseUid, { password: newPassword });
    }

    await user.setPassword(newPassword);
    if (user.authProvider === "firebase") user.authProvider = "hybrid";
    await user.save();
    await PasswordReset.deleteOne({ _id: record._id });

    res.json({ message: "Password reset successfully. You can log in now." });
  } catch (err) {
    next(err);
  }
});

router.post("/logout", (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    req.session.destroy(() => res.clearCookie("connect.sid").json({ message: "Logged out." }));
  });
});

router.get("/me", (req, res) => res.json({ user: req.user || null }));

module.exports = router;
