require("dotenv").config();

const express = require("express");
const connectDB = require("./config/db");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const User = require("./models/user");
const authRoutes = require("./routes/auth");
const listingRoutes = require("./routes/listings");
const userRoutes = require("./routes/users");
const adminRoutes = require("./routes/admin");
const { notFound, errorHandler } = require("./middleware/error");
const aiRoutes = require("./routes/ai");

const app = express();
const dbUrl = process.env.ATLASDB_URL || process.env.MONGODB_URI;



app.set("trust proxy", 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true
}));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error(
      "MongoDB connection error:",
      err.message
    );
    next(err);
  }
});

app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: "draft-7", legacyHeaders: false }));

const sessionSecret = process.env.SESSION_SECRET;

if (!sessionSecret) {
  throw new Error(
    "SESSION_SECRET is missing. Add SESSION_SECRET to server/.env"
  );
}

if (sessionSecret.length < 32) {
  throw new Error(
    "SESSION_SECRET must be at least 32 characters long."
  );
}

/*
 * Use a clean object-based MongoDB session store.
 * stringify:false prevents connect-mongo from calling JSON.parse()
 * on session objects that MongoDB already returned as BSON objects.
 * A fresh collection avoids incompatible sessions from earlier versions.
 */
const store = dbUrl
  ? MongoStore.create({
    mongoUrl: dbUrl,
    collectionName: "nestvoyage_sessions_v6",
    stringify: false,
    touchAfter: 24 * 3600
  })
  : null;

const sessionOptions = {
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: process.env.NODE_ENV === "production"
  }
};

if (store) {
  sessionOptions.store = store;
}

app.use(session(sessionOptions));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/api/health", (req, res) => res.json({ status: "ok", service: "NestVoyage API" }));
app.use("/api/auth", authRoutes);
app.use("/api/listings", listingRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/ai", aiRoutes);


app.use(notFound);
app.use(errorHandler);

module.exports = app;
