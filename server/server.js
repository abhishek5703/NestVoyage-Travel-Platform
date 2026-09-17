require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`NestVoyage API running on http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error("Startup failed:", err);
    process.exit(1);
  });
