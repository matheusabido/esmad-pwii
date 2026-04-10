import type { Express, Request, Response } from "express";
import type Controller from "./controller.js";
import z from "zod";
import { MAX_FILE_SIZE } from "@/config/files.js";
import { authMiddlware } from "@/middleware/auth.js";
import upload from "@/service/upload.js";
import { rm } from "node:fs/promises";
import { readdirSync } from "node:fs";
import path from "node:path";

const storeValidator = z.object({
  shortDescription: z
    .string("Resumo deve ser um texto")
    .trim()
    .min(5, "Resumo deve ter pelo menos 5 caracteres")
    .max(255, "Resumo deve ter no máximo 255 caracteres"),
  description: z.string("Descrição deve ser um texto").trim(),
  buildingId: z.coerce
    .number("buildingId deve ser um número")
    .int("buildingId deve ser um número inteiro")
    .positive("buildingId deve ser um número positivo"),
  location: z
    .string("Local deve ser um texto")
    .trim()
    .min(5, "Local deve ter pelo menos 5 caracteres")
    .max(255, "Local deve ter no máximo 255 caracteres"),
});

const filesValidator = z.array(
  z.object({
    fieldname: z.string("fieldname deve ser uma string").trim(),
    originalname: z.string("originalname deve ser uma string").trim(),
    encoding: z.string("encoding deve ser uma string").trim(),
    mimetype: z.string("mimetype deve ser uma string").trim(),
    filename: z.string("filename deve ser uma string").trim(),
    path: z.string("path deve ser uma string").trim(),
    size: z.coerce
      .number("size deve ser um número")
      .max(MAX_FILE_SIZE, "Arquivo muito grande"),
  }),
);

export default class IncidentController implements Controller {
  async store(req: Request, res: Response) {
    const files = filesValidator.parse(req.files);

    try {
      const { shortDescription, description, location, buildingId } =
        storeValidator.parse(req.body);

      return res
        .status(200)
        .json({ shortDescription, description, location, buildingId, files });
    } catch (err) {
      await Promise.all(files.map((currentFile) => rm(currentFile.path)));
      throw err;
    }
  }

  registerRoutes(app: Express): void {
    app.post(
      "/incident",
      authMiddlware,
      upload.array("pictures", 5),
      this.store,
    );
  }
}
