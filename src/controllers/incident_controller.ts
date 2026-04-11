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
import { readFile, rm } from "node:fs/promises";
import logger from "@/service/logger.js";
import { s3DeleteKeys } from "@/utils/s3.js";
import Incident from "@/models/incident.js";
import sequelize from "@/service/sequelize.js";
import { AppError } from "@/utils/errors.js";
import IncidentPicture from "@/models/incident_picture.js";
import Building from "@/models/building.js";
import Category from "@/models/category.js";

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
  categoryId: z.coerce
    .number("categoryId deve ser um número")
    .int("categoryId deve ser um número inteiro")
    .positive("categoryId deve ser um número positivo"),
  picturesData: z
    .string()
    .transform((val) => {
      try {
        return JSON.parse(val);
      } catch {
        throw new AppError(400, "Dados das fotos devem ser um JSON válido");
      }
    })
    .pipe(
      z
        .array(
          z.object({
            title: z
              .string("O título da foto deve ser uma string")
              .trim()
              .min(3, "O título da foto deve ter pelo menos 3 caracteres")
              .max(255, "O título da foto deve ter no máximo 255 caracteres"),
            description: z
              .string("A descrição da foto deve ser uma string")
              .trim()
              .min(5, "A descrição da foto deve ter pelo menos 5 caracteres")
              .max(255, "A descrição da foto deve ter no máximo 255 caracteres")
              .optional(),
          }),
          "Os dados das fotos deve ser uma lista",
        )
        .min(1, "Dados das fotos devem ser fornecidos para cada foto enviada")
        .max(5, "No máximo 5 fotos podem ser enviadas"),
    ),
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
      "É obrigatório enviar pelo menos uma foto",
    )
    .min(1, "Pelo menos um arquivo deve ser enviado")
    .max(5, "No máximo 5 arquivos podem ser enviados"),
});

export default class IncidentController implements Controller {
  async store(req: Request, res: Response) {
    const { files } = filesValidator.parse({ files: req.files });

    const {
      shortDescription,
      description,
      location,
      buildingId,
      categoryId,
      picturesData,
    } = storeValidator.parse(req.body);

    if (picturesData.length < files.length) {
      throw new AppError(
        400,
        "Dados das fotos insuficientes para as fotos enviadas",
      );
    }

    const building = await Building.findByPk(buildingId, {
      raw: true,
      attributes: ["id", "name"],
    });
    if (!building) {
      throw new AppError(404, "Edifício não encontrado");
    }

    const category = await Category.findByPk(categoryId, {
      raw: true,
      attributes: ["id", "name"],
    });
    if (!category) {
      throw new AppError(404, "Categoria não encontrada");
    }

    const picturesUrl: string[] = [];
    for (const file of files) {
      const fileContent = await readFile(file.path);
      const uploadParams = {
        Bucket: process.env.S3_BUCKET_NAME!,
        Key: `incidents/${Date.now()}_${file.filename}`,
        Body: fileContent,
        ContentType: file.mimetype,
      } satisfies PutObjectCommandInput;

      try {
        await s3Client.send(new PutObjectCommand(uploadParams));
        picturesUrl.push(uploadParams.Key);
      } catch (error) {
        logger.error(error, "An error occurred while trying to upload a file");
        await s3DeleteKeys(picturesUrl);
        throw new AppError(500, "Erro ao processar os arquivos");
      }
    }

    const tx = await sequelize.transaction();

    try {
      const incident = await Incident.create(
        {
          userId: req.user!.id,
          shortDescription,
          description,
          buildingId,
          location,
          categoryId,
        },
        { transaction: tx },
      );

      const pictures = picturesUrl.map((url, index) => {
        const data = picturesData[index]!;
        return {
          incidentId: incident.id,
          pictureUrl: url,
          title: data.title,
          description: data.description,
        };
      });

      const incidentPictures = await IncidentPicture.bulkCreate(pictures, {
        transaction: tx,
      });

      await tx.commit();
      await Promise.all(files?.map((file) => rm(file.path)) ?? []);

      return res.status(201).json({
        id: incident.id,
        shortDescription: incident.shortDescription,
        description: incident.description,
        location: incident.location,
        buildingId: incident.buildingId,
        categoryId: incident.categoryId,
        pictures: incidentPictures.map((pic) => ({
          id: pic.id,
          pictureUrl: pic.pictureUrl,
          title: pic.title,
          description: pic.description,
        })),
        building,
        category,
      });
    } catch (error) {
      await tx.rollback();
      logger.error(
        error,
        "An error occurred while trying to create an incident",
      );
      throw new AppError(500, "Erro ao criar o incidente");
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
