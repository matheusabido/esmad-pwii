import express from "express";
import { Sequelize } from "sequelize";
import "dotenv/config";
import logger from "@util/logger.js";
import loggerMiddleware from "@middleware/logger.js";

const app = express();

app.use(loggerMiddleware);

const sequelize = new Sequelize(
  `mysql://${process.env.MYSQL_USER}:${process.env.MYSQL_PASSWORD}@${process.env.MYSQL_HOST}:${process.env.MYSQL_PORT}/${process.env.MYSQL_DATABASE}`,
  {
    pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
    logging: (msg) => logger.debug(msg),
  },
);

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
