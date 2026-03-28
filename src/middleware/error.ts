import logger from "@/service/logger.js";
import type { NextFunction, Request, Response } from "express";
import { MulterError } from "multer";

async function errorMiddleware(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (err) {
    if (err instanceof MulterError) {
      logger.error(`Multer error: ${err.message} (code: ${err.code})`);
      switch (err.code) {
        case "LIMIT_FIELD_COUNT":
          return res.status(400).json({ error: "Too many fields" });
        case "LIMIT_FILE_SIZE":
          return res.status(400).json({ error: "File too large" });
        case "LIMIT_FILE_COUNT":
          return res.status(400).json({ error: "Too many files" });
        case "MISSING_FIELD_NAME":
          return res.status(400).json({ error: "Missing field name" });
        case "LIMIT_FIELD_KEY":
          return res.status(400).json({ error: "Field name too long" });
        case "LIMIT_FIELD_VALUE":
          return res.status(400).json({ error: "Field value too long" });
        case "LIMIT_UNEXPECTED_FILE":
          return res.status(400).json({ error: "Unexpected file" });
        case "LIMIT_PART_COUNT":
          return res.status(400).json({ error: "Too many parts" });
        default:
          return res.status(400).json({ error: "Upload error" });
      }
    }
  }
  next(err);
}

export default errorMiddleware;
