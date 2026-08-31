const app = require("./app");
const connectDB = require("./configs/db");
const seedInitialData = require("./utils/seeder");

const PORT = process.env.PORT || 5002;

const startServer = async () => {
  try {
    await connectDB();
    await seedInitialData();
    app.listen(PORT, () => {
      console.log(`Horizon Capital Backend server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failure:", error.message);
    process.exit(1);
  }
};

startServer();