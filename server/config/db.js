const mongoose = require("mongoose");

// Do not let queries silently sit in Mongoose's buffer.
// If the connection is unavailable, fail at the connection layer.
mongoose.set("bufferCommands", false);

const cache =
  global.__nestVoyageMongo ||
  (global.__nestVoyageMongo = {
    promise: null
  });

async function connectDB() {
  const uri =
    process.env.ATLASDB_URL ||
    process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      "Missing ATLASDB_URL or MONGODB_URI environment variable."
    );
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!cache.promise) {
    cache.promise = mongoose
      .connect(uri, {
        serverSelectionTimeoutMS: 10000,
        maxPoolSize: 10
      })
      .then(() => {
        console.log("MongoDB connected");
        return mongoose.connection;
      })
      .catch(err => {
        cache.promise = null;
        console.error(
          "MongoDB connection failed:",
          err.message
        );
        throw err;
      });
  }

  return cache.promise;
}

mongoose.connection.on("disconnected", () => {
  cache.promise = null;
  console.error("MongoDB disconnected");
});

mongoose.connection.on("error", err => {
  console.error(
    "MongoDB error:",
    err.message
  );
});

module.exports = connectDB;