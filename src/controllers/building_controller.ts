import type { Express, Request, Response } from "express";
import type Controller from "./controller.js";
import z from "zod";
import Building from "@/models/building.js";
import { AVAILABLE_STATUSES } from "@/enum/status.js";
import { authMiddlware } from "@/middleware/auth.js";
import { Op, type WhereOptions } from "sequelize";
import { paginate } from "@/utils/paginate.js";
import { getPolygonCoordinatesByWKT } from "@/utils/wellknown.js";
import logger from "@/service/logger.js";

const storeValidator = z.object({
  name: z
    .string("Nome deve ser um texto")
    .trim()
    .min(3, "Nome deve ter pelo menos 3 caracteres"),
  description: z
    .string("Descrição deve ser um texto")
    .trim()
    .min(5, "Descrição deve ter pelo menos 5 caracteres"),
  area: z
    .string("Área deve ser um texto")
    .trim()
    .regex(
      /^POLYGON\s*\(\((\s*\d+\s\d+,*\s*)+\)\)$/,
      "Área deve respeitar o formato do polygon WKT",
    ),
});

const patchValidator = z.object({
  name: z
    .string("Nome deve ser um texto")
    .trim()
    .min(3, "Nome deve ter pelo menos 3 caracteres")
    .optional(),
  description: z
    .string("Descrição deve ser um texto")
    .trim()
    .min(5, "Descrição deve ter pelo menos 5 caracteres")
    .optional(),
  area: z
    .string("Área deve ser um texto")
    .trim()
    .regex(
      /^POLYGON\s*\(\((\s*\d+\s\d+,*\s*)+\)\)$/,
      "Área deve respeitar o formato do polygon WKT",
    )
    .optional(),
  status: z
    .enum(AVAILABLE_STATUSES, "Status deve ser um valor válido")
    .optional(),
});

const findValidator = z.object({
  id: z.coerce
    .number("ID deve ser um número")
    .int("ID deve ser um inteiro")
    .positive("ID deve ser um número positivo"),
});

const listValidator = z.object({
  name: z.string("O nome deve ser um texto").trim().optional(),
  page: z.coerce
    .number("A página deve ser um número")
    .int("A página deve ser um número inteiro")
    .positive("A página deve ser um número positivo")
    .optional()
    .default(1),
});

export default class BuildingController implements Controller {
  async list(req: Request, res: Response) {
    const { name, page } = listValidator.parse(req.query);

    const where: WhereOptions<any> = {};
    if (name) where.name = { [Op.iLike]: `%${name}%` };

    const { rows, count } = await Building.findAndCountAll({
      where: where,
      offset: (page - 1) * 20,
      order: [["name", "ASC"]],
      limit: 20,
    });

    return res.status(200).json(paginate({ rows, total: count, page }));
  }

  async find(req: Request, res: Response) {
    const { id } = findValidator.parse(req.params);

    const building = await Building.findByPk(id);
    if (!building) {
      return res.status(404).json({ error: "Edifício não encontrado" });
    }

    return res.status(200).json(building);
  }

  async store(req: Request, res: Response) {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ error: "Acesso não autorizado" });
    }

    const { name, description, area } = storeValidator.parse(req.body);

    let coordinates: number[][];
    try {
      coordinates = getPolygonCoordinatesByWKT(area);
    } catch (error) {
      logger.error(error, "Error while parsing polygon coordinates: " + area);
      return res
        .status(400)
        .json({ error: "Coordenadas do polígono inválidas" });
    }

    const building = await Building.create({
      name,
      description,
      area: {
        type: "Polygon",
        coordinates: [coordinates],
      },
      status: "active",
    });

    return res.status(201).json(building);
  }

  async patch(req: Request, res: Response) {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ error: "Acesso não autorizado" });
    }

    const { id } = findValidator.parse(req.params);
    const { name, description, area, status } = patchValidator.parse(req.body);

    const building = await Building.findByPk(id);
    if (!building) {
      return res.status(404).json({ error: "Edifício não encontrado" });
    }

    if (name) building.name = name;
    if (description) building.description = description;
    if (status) building.status = status;
    if (area) {
      try {
        const coordinates = getPolygonCoordinatesByWKT(area);
        building.area = {
          type: "Polygon",
          coordinates: [coordinates],
        };
      } catch (error) {
        logger.error(error, "Error while parsing polygon coordinates: " + area);
        return res
          .status(400)
          .json({ error: "Coordenadas do polígono inválidas" });
      }
    }

    await building.save();

    return res.status(200).json(building);
  }

  async delete(req: Request, res: Response) {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ error: "Acesso não autorizado" });
    }

    const { id } = findValidator.parse(req.params);

    const building = await Building.findByPk(id);
    if (!building) {
      return res.status(404).json({ error: "Edifício não encontrado" });
    }

    await building.destroy();
    return res.status(204).send();
  }

  registerRoutes(app: Express): void {
    app.get("/buildings", authMiddlware, this.list);
    app.get("/building/:id", authMiddlware, this.find);
    app.post("/building", authMiddlware, this.store.bind(this));
    app.patch("/building/:id", authMiddlware, this.patch.bind(this));
    app.delete("/building/:id", authMiddlware, this.delete);
  }
}
