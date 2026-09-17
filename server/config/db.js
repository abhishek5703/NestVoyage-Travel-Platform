const mongoose = require("mongoose");

async function connectDB() {
  const uri = process.env.ATLASDB_URL || process.env.MONGODB_URI;
  if (!uri) throw new Error("Missing ATLASDB_URL/MONGODB_URI");
  await mongoose.connect(uri);
  console.log("MongoDB connected");
}

module.exports = connectDB;
