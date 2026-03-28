import logger from "@service/logger.js";
import type { NextFunction, Request, Response } from "express";

function loggerMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = new Date();

  res.on("finish", () => {
    const duration = new Date().getTime() - start.getTime();
    if (res.statusCode < 400) {
      logger.info(
        `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`,
      );
    } else {
      logger.error(
        `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`,
      );
    }
  });

  next();
}

export default loggerMiddleware;
