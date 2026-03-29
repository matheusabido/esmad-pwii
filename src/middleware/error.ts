import logger from "@/service/logger.js";
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { MulterError } from "multer";
import { ZodError } from "zod";

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
    } else if (err instanceof SyntaxError) {
      return res.status(400).json({ error: "Invalid JSON" });
    } else if (err instanceof jwt.JsonWebTokenError) {
      return res.status(403).json({ error: "Invalid credentials" });
    } else if (err instanceof ZodError) {
      const details = err.issues.reduce(
        (a, b) => ({ ...a, [b.path.join(".")]: b.message }),
        {},
      );

      return res.status(400).json({ error: "Validation error", details });
    } else if (process.env.NODE_ENV === "development") {
      console.log(err);
    }
  }
  next(err);
}

export default errorMiddleware;
