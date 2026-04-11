import type { Express, Request, Response } from "express";
import type Controller from "./controller.js";
import z, { file } from "zod";
import { MAX_FILE_SIZE } from "@/config/files.js";
import { authMiddlware } from "@/middleware/auth.js";
import upload from "@/service/upload.js";
import s3Client from "@/service/s3.js";
import {
  GetObjectCommand,
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
import { AVAILABLE_PRIORITIES } from "@/enum/priority.js";
import Status from "@/models/status.js";
import { Op } from "sequelize";
import { paginate } from "@/utils/paginate.js";

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

const patchValidator = z.object({
  shortDescription: z
    .string("Resumo deve ser um texto")
    .trim()
    .min(5, "Resumo deve ter pelo menos 5 caracteres")
    .max(255, "Resumo deve ter no máximo 255 caracteres")
    .optional(),
  description: z.string("Descrição deve ser um texto").trim().optional(),
  location: z
    .string("Local deve ser um texto")
    .trim()
    .min(5, "Local deve ter pelo menos 5 caracteres")
    .max(255, "Local deve ter no máximo 255 caracteres")
    .optional(),
  priority: z.enum(AVAILABLE_PRIORITIES).optional(),
  statusId: z.coerce
    .number("statusId deve ser um número")
    .int("statusId deve ser um número inteiro")
    .positive("statusId deve ser um número positivo")
    .optional(),
  categoryId: z.coerce
    .number("categoryId deve ser um número")
    .int("categoryId deve ser um número inteiro")
    .positive("categoryId deve ser um número positivo")
    .optional(),
  buildingId: z.coerce
    .number("buildingId deve ser um número")
    .int("buildingId deve ser um número inteiro")
    .positive("buildingId deve ser um número positivo")
    .optional(),
});

const findValidator = z.object({
  id: z.coerce
    .number("id deve ser um número")
    .int("id deve ser um número inteiro")
    .positive("id deve ser um número positivo")
    .optional(),
});

const getPictureValidator = z.object({
  id: z.coerce
    .number("id deve ser um número")
    .int("id deve ser um número inteiro")
    .positive("id deve ser um número positivo"),
  pictureId: z.coerce
    .number("pictureId deve ser um número")
    .int("pictureId deve ser um número inteiro")
    .min(1, "pictureId deve ser pelo menos 1")
    .max(5, "pictureId deve ser no máximo 5"),
});

const listValidator = z.object({
  page: z.coerce
    .number("page deve ser um número")
    .int("page deve ser um número inteiro")
    .positive("page deve ser um número positivo")
    .optional(),
  priority: z.enum(AVAILABLE_PRIORITIES).optional(),
  statusId: z.coerce
    .number("statusId deve ser um número")
    .int("statusId deve ser um número inteiro")
    .positive("statusId deve ser um número positivo")
    .optional(),
  categoryId: z.coerce
    .number("categoryId deve ser um número")
    .int("categoryId deve ser um número inteiro")
    .positive("categoryId deve ser um número positivo")
    .optional(),
  query: z
    .string("query deve ser um texto")
    .trim()
    .min(3, "query deve ter pelo menos 3 caracteres")
    .max(255, "query deve ter no máximo 255 caracteres")
    .optional(),
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
  async find(req: Request, res: Response) {
    const { id } = findValidator.parse(req.params);

    const incident = await Incident.findByPk(id, {
      include: ["pictures", "building", "category", "status"],
    });
    if (!incident) {
      throw new AppError(404, "Incidente não encontrado");
    }

    return res.json(incident);
  }

  async getPicture(req: Request, res: Response) {
    const { id, pictureId } = getPictureValidator.parse(req.params);

    const incident = await Incident.findByPk(id, { include: ["pictures"] });
    if (!incident) {
      throw new AppError(404, "Incidente não encontrado");
    }

    if (pictureId > incident.pictures!.length) {
      throw new AppError(404, "Foto não encontrada para este incidente");
    }

    const picture = incident.pictures![pictureId - 1];
    const fileStream = await s3Client.send(
      new GetObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME!,
        Key: picture!.pictureUrl,
      }),
    );

    const stream = await fileStream.Body?.transformToByteArray();
    if (!stream) {
      throw new AppError(500, "Erro ao ler o arquivo da foto");
    }
    res.setHeader(
      "Content-Type",
      fileStream.ContentType ?? "application/octet-stream",
    );
    res.send(stream);
  }

  async list(req: Request, res: Response) {
    const {
      page = 1,
      priority,
      statusId,
      categoryId,
      query,
    } = listValidator.parse(req.query);

    const where: any = {};
    if (priority) where.priority = priority;
    if (statusId) where.statusId = statusId;
    if (categoryId) where.categoryId = categoryId;
    if (query)
      where[Op.or] = [
        { shortDescription: { [Op.iLike]: `%${query}%` } },
        { description: { [Op.iLike]: `%${query}%` } },
      ];

    const { rows, count: total } = await Incident.findAndCountAll({
      where,
      include: [
        { model: Building, as: "building", attributes: ["id", "name"] },
        {
          model: Category,
          as: "category",
          attributes: ["id", "name", "color"],
        },
        { model: Status, as: "status", attributes: ["id", "name", "color"] },
      ],
      order: [["createdAt", "DESC"]],
      offset: (page - 1) * 20,
      limit: 20,
    });

    return res.json(paginate({ rows, total, page }));
  }

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

  async patch(req: Request, res: Response) {
    const { id } = findValidator.parse(req.params);
    const {
      shortDescription,
      description,
      location,
      priority,
      statusId,
      categoryId,
      buildingId,
    } = patchValidator.parse(req.body);

    const incident = await Incident.findByPk(id);
    if (!incident) {
      throw new AppError(404, "Incidente não encontrado");
    }

    if (req.user!.role !== "admin" && incident.userId !== req.user!.id) {
      throw new AppError(
        403,
        "Você não tem permissão para editar este incidente",
      );
    }

    if (categoryId) {
      const category = await Category.findByPk(categoryId, {
        raw: true,
        attributes: ["id", "name"],
      });
      if (!category) {
        throw new AppError(404, "Categoria não encontrada");
      }

      incident.categoryId = categoryId;
    }

    if (buildingId) {
      const building = await Building.findByPk(buildingId, {
        raw: true,
        attributes: ["id", "name"],
      });
      if (!building) {
        throw new AppError(404, "Edifício não encontrado");
      }

      incident.buildingId = buildingId;
    }

    if (req.user!.role === "admin" && statusId) {
      const status = await Status.findByPk(statusId, {
        raw: true,
        attributes: ["id", "name"],
      });
      if (!status) {
        throw new AppError(404, "Status não encontrado");
      }

      incident.statusId = statusId;
    }

    if (req.user!.role === "admin" && priority) incident.priority = priority;

    if (shortDescription) incident.shortDescription = shortDescription;
    if (description) incident.description = description;
    if (location) incident.location = location;

    await incident.save();
    return res.json(incident);
  }

  async delete(req: Request, res: Response) {
    const { id } = findValidator.parse(req.params);

    const incident = await Incident.findByPk(id);
    if (!incident) {
      throw new AppError(404, "Incidente não encontrado");
    }

    if (req.user!.role !== "admin" && incident.userId !== req.user!.id) {
      throw new AppError(
        403,
        "Você não tem permissão para deletar este incidente",
      );
    }

    await incident.destroy();
    return res.status(204).send();
  }

  registerRoutes(app: Express): void {
    app.get("/incidents", authMiddlware, this.list);
    app.get("/incident/:id/picture/:pictureId", authMiddlware, this.getPicture);
    app.get("/incident/:id", authMiddlware, this.find);
    app.post(
      "/incident",
      authMiddlware,
      upload.array("pictures", 5),
      this.store,
    );
    app.patch("/incident/:id", authMiddlware, this.patch);
    app.delete("/incident/:id", authMiddlware, this.delete);
  }
}
