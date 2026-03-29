import express from "express";
import "dotenv/config";
import logger from "@service/logger.js";
import loggerMiddleware from "@middleware/logger.js";
import errorMiddleware from "./middleware/error.js";
import { registerRoutes } from "./controllers/controller.js";
import { associateModels } from "./models/index.js";

await associateModels();

const app = express();

app.use(express.json());
app.use(loggerMiddleware);

registerRoutes(app);

app.use(errorMiddleware);

app.listen(3000, () => {
  logger.info("Server is running on http://localhost:3000");
});
