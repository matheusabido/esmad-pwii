import express from "express";
import "dotenv/config";
import logger from "@service/logger.js";
import loggerMiddleware from "@middleware/logger.js";
import sequelize from "@service/sequelize.js";

const app = express();

app.use(loggerMiddleware);

app.get("/", async (req, res) => {
  try {
    await sequelize.authenticate();
    logger.info("Connection has been established successfully.");
    res.json({ message: "Connected to the database successfully!" });
  } catch (error) {
    logger.error(error, "Unable to connect to the database");
    res.status(500).json({ error: "Unable to connect to the database" });
  }
});

app.listen(3000, () => {
  logger.info("Server is running on http://localhost:3000");
});
