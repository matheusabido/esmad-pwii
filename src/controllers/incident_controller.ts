import type { Express, Request, Response } from "express";
import type Controller from "./controller.js";
import z from "zod";
import { MAX_FILE_SIZE } from "@/config/files.js";
import { authMiddlware } from "@/middleware/auth.js";
import upload from "@/service/upload.js";
import s3Client from "@/service/s3.js";
import {
  PutObjectCommand,
  type PutObjectCommandInput,
} from "@aws-sdk/client-s3";
import { readFile } from "node:fs/promises";
import { UploadError } from "@/utils/errors.js";
import logger from "@/service/logger.js";

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

const filesValidator = z.object({
  files: z
    .array(
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
    )
    .min(1, "Pelo menos um arquivo deve ser enviado")
    .max(5, "No máximo 5 arquivos podem ser enviados"),
});

export default class IncidentController implements Controller {
  async store(req: Request, res: Response) {
    const { files } = filesValidator.parse({ files: req.files });

    const { shortDescription, description, location, buildingId } =
      storeValidator.parse(req.body);

    const picturesUrl: string[] = [];
    for (const file of files) {
      const fileContent = await readFile(file.path);
      const uploadParams = {
        Bucket: process.env.S3_BUCKET_NAME!,
        Key: `incidents/${file.filename}`,
        Body: fileContent,
        ContentType: file.mimetype,
      } satisfies PutObjectCommandInput;

      try {
        await s3Client.send(new PutObjectCommand(uploadParams));
        picturesUrl.push(uploadParams.Key);
      } catch (error) {
        logger.error(error, "An error occurred while trying to upload a file");
        throw new UploadError("Erro ao enviar arquivo para o S3", picturesUrl);
      }
    }

    return res
      .status(200)
      .json({ shortDescription, description, location, buildingId, files });
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
