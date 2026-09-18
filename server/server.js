require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  connectDB()
    .then(() => {
      app.listen(PORT, () => {
        console.log(
          `NestVoyage API running on http://localhost:${PORT}`
        );
      });
    })
    .catch(err => {
      console.error(
        "Startup failed:",
        err.message
      );
      process.exit(1);
    });
}

module.exports = app;