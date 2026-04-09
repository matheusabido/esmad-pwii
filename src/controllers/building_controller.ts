import type { Express, Request, Response } from "express";
import type Controller from "./controller.js";
import z from "zod";
import Building from "@/models/building.js";
import { AVAILABLE_STATUSES } from "@/enum/status.js";
import { authMiddlware } from "@/middleware/auth.js";
import { Op, type WhereOptions } from "sequelize";
import { paginate } from "@/utils/paginate.js";

const storeValidator = z.object({
  name: z
    .string("Nome deve ser um texto")
    .trim()
    .min(3, "Nome deve ter pelo menos 3 caracteres."),
  description: z
    .string("Descrição deve ser um texto")
    .trim()
    .min(5, "Descrição deve ter pelo menos 5 caracteres."),
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
    .min(3, "Nome deve ter pelo menos 3 caracteres.")
    .optional(),
  description: z
    .string("Descrição deve ser um texto")
    .trim()
    .min(5, "Descrição deve ter pelo menos 5 caracteres.")
    .optional(),
  area: z
    .string("Área deve ser um texto")
    .trim()
    .regex(
      /^POLYGON\s*\(\((\s*\d+\s\d+,*\s*)+\)\)$/,
      "Área deve respeitar o formato do polygon WKT",
    )
    .optional(),
  status: z.enum(AVAILABLE_STATUSES).optional(),
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
      limit: 20,
    });

    return res.status(200).json(paginate({ rows, total: count, page }));
  }

  async find(req: Request, res: Response) {
    const { id } = findValidator.parse(req.params);

    const building = await Building.findByPk(id);
    if (!building) {
      return res.status(404).json({ error: "Edifício não encontrado." });
    }

    return res.status(200).json(building);
  }

  async store(req: Request, res: Response) {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ error: "Acesso não autorizado." });
    }

    const { name, description, area } = storeValidator.parse(req.body);

    const error = this.validatePolygonPoints(area);
    if (error) {
      return res.status(error.status).json({ error: error.message });
    }

    const building = await Building.create({
      name,
      description,
      area,
      status: "active",
    });

    return res.status(201).json(building);
  }

  async patch(req: Request, res: Response) {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ error: "Acesso não autorizado." });
    }

    const { id } = findValidator.parse(req.params);
    const { name, description, area, status } = patchValidator.parse(req.body);

    const building = await Building.findByPk(id);
    if (!building) {
      return res.status(404).json({ error: "Edifício não encontrado." });
    }

    if (area) {
      const error = this.validatePolygonPoints(area);
      if (error) {
        return res.status(error.status).json({ error: error.message });
      }
    }

    await building.update({
      name: name ?? building.name,
      description: description ?? building.description,
      area: area ?? building.area,
      status: status ?? building.status,
    });

    return res.status(200).json(building);
  }

  async delete(req: Request, res: Response) {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ error: "Acesso não autorizado." });
    }

    const { id } = findValidator.parse(req.params);

    const building = await Building.findByPk(id);
    if (!building) {
      return res.status(404).json({ error: "Edifício não encontrado." });
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

  private validatePolygonPoints(
    wkt: string,
  ): { message: string; status: number } | undefined {
    const points = wkt.split("((")[1]?.split("))")[0]?.split(",");
    if (!points || points.length < 2) {
      return {
        message: "Área deve conter pontos válidos.",
        status: 400,
      };
    }

    const [x1, y1] = points[0]!.split(" ").map((p) => Number(p.trim())) as [
      number,
      number,
    ];
    const [x2, y2] = points[points.length - 1]!.split(" ").map((p) =>
      Number(p.trim()),
    ) as [number, number];

    if (isNaN(x1) || isNaN(y1) || isNaN(x2) || isNaN(y2)) {
      return {
        message: "Área deve conter coordenadas numéricas válidas.",
        status: 400,
      };
    }

    if (x1 !== x2 || y1 !== y2) {
      return {
        message: "Área deve ser um polígono fechado.",
        status: 400,
      };
    }
  }
}
