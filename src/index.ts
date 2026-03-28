import express from "express";
import "dotenv/config";
import logger from "@service/logger.js";
import loggerMiddleware from "@middleware/logger.js";
import TestController from "./controllers/test_controller.js";
import errorMiddleware from "./middleware/error.js";

const app = express();

app.use(loggerMiddleware);

new TestController().registerRoutes(app);

app.use(errorMiddleware);

app.listen(3000, () => {
  logger.info("Server is running on http://localhost:3000");
});
