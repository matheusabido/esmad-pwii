import logger from "@/service/logger.js";
import { AppError } from "@/utils/errors.js";
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { MulterError } from "multer";
import { rm } from "node:fs/promises";
import { ZodError } from "zod";

async function errorMiddleware(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (err) {
    if (Array.isArray(req.files)) {
      await Promise.all(req.files.map((currentFile) => rm(currentFile.path)));
    } else {
      const files = Object.values(req.files ?? {}).flat();
      await Promise.all(files.map((currentFile) => rm(currentFile.path)));
    }

    if (err instanceof MulterError) {
      logger.error(`Multer error: ${err.message} (code: ${err.code})`);
      switch (err.code) {
        case "LIMIT_FIELD_COUNT":
          return res.status(400).json({ error: "Muitos campos" });
        case "LIMIT_FILE_SIZE":
          return res.status(400).json({ error: "Arquivo muito grande" });
        case "LIMIT_FILE_COUNT":
          return res.status(400).json({ error: "Muitos arquivos enviados" });
        case "MISSING_FIELD_NAME":
          return res.status(400).json({ error: "Campo ausente" });
        case "LIMIT_FIELD_KEY":
          return res
            .status(400)
            .json({ error: "Limite de campos atingido (1)" });
        case "LIMIT_FIELD_VALUE":
          return res
            .status(400)
            .json({ error: "Limite de campos atingido (2)" });
        case "LIMIT_UNEXPECTED_FILE":
          return res
            .status(400)
            .json({ error: "Muitos arquivos foram enviados" });
        case "LIMIT_PART_COUNT":
          return res.status(400).json({ error: "Limite de partes atingido" });
        default:
          return res.status(400).json({ error: "Erro de upload" });
      }
    } else if (err instanceof AppError) {
      return res.status(err.statusCode).json({ error: err.message });
    } else if (err instanceof SyntaxError) {
      return res.status(400).json({ error: "JSON inválido" });
    } else if (err instanceof jwt.JsonWebTokenError) {
      return res.status(403).json({ error: "Credenciais inválidas" });
    } else if (err instanceof ZodError) {
      const details = err.issues.reduce(
        (a, b) => ({ ...a, [b.path.join(".")]: b.message }),
        {},
      );

      return res.status(400).json({ error: "Erro de validação", details });
    } else if (err.message === "Unexpected end of form") {
      return res.status(422).json({ error: "Fim de formulário inesperado" });
    } else if (process.env.NODE_ENV === "development") {
      console.log(err);
    }

    logger.error(err, "Unhandled error");
    return res.status(500).json({ error: "Erro interno do servidor" });
  }

  next(err);
}

export default errorMiddleware;
