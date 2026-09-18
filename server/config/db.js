const mongoose = require("mongoose");

// Prevent Mongoose from silently queueing database operations
// when a connection is unavailable.
mongoose.set("bufferCommands", false);

const cached =
  global.__nestVoyageMongo || {
    promise: null
  };

global.__nestVoyageMongo = cached;

async function connectDB() {
  const uri =
    process.env.ATLASDB_URL ||
    process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      "Missing ATLASDB_URL or MONGODB_URI environment variable."
    );
  }

  // Reuse an existing connection inside a warm Vercel instance.
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // Reuse an in-progress connection.
  if (!cached.promise) {
    cached.promise = mongoose
      .connect(uri, {
        serverSelectionTimeoutMS: 10000,
        maxPoolSize: 10,
        bufferCommands: false
      })
      .then(() => {
        console.log("MongoDB connected");
        return mongoose.connection;
      })
      .catch(err => {
        cached.promise = null;
        console.error(
          "MongoDB connection failed:",
          err.message
        );
        throw err;
      });
  }

  try {
    return await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }
}

mongoose.connection.on(
  "disconnected",
  () => {
    cached.promise = null;
    console.error("MongoDB disconnected");
  }
);

mongoose.connection.on(
  "error",
  err => {
    console.error(
      "MongoDB error:",
      err.message
    );
  }
);

module.exports = connectDB;