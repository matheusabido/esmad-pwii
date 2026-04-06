import type { Express, Request, Response } from "express";
import type Controller from "./controller.js";
import Status from "@/models/status.js";
import z from "zod";
import { Op, type WhereOptions } from "sequelize";
import { authMiddlware } from "@/middleware/auth.js";

const listValidator = z.object({
  name: z.string("O nome deve ser uma string").trim().optional(),
  page: z.coerce
    .number("A página deve ser um número")
    .int("A página deve ser um número inteiro")
    .positive("A página deve ser um número positivo")
    .optional()
    .default(1),
});

const findValidator = z.object({
  id: z.coerce
    .number("ID deve ser um número")
    .int("ID deve ser um inteiro")
    .positive("ID deve ser um número positivo"),
});

export default class StatusController implements Controller {
  async list(req: Request, res: Response) {
    if (req.user!.role !== "admin") {
      return res.status(403).json({ error: "Acesso não autorizado" });
    }

    const { page, name } = listValidator.parse(req.query);

    const where: WhereOptions<any> = {};
    if (name) where.name = { [Op.iLike]: `%${name}%` };

    const { rows, count } = await Status.findAndCountAll({
      where: where,
      offset: (page - 1) * 20,
      limit: 20,
    });

    return res.status(200).json({
      data: rows,
      meta: {
        total: count,
        page,
        lastPage: Math.max(Math.ceil(count / 20), 1),
      },
    });
  }

  async find(req: Request, res: Response) {
    const { id } = findValidator.parse(req.params);

    const status = await Status.findByPk(id);
    if (!status) {
      return res.status(404).json({ error: "Status não encontrado" });
    }

    return res.status(200).json({
      id: status.id,
      name: status.name,
      description: status.description,
      color: status.color,
    });
  }

  registerRoutes(app: Express): void {
    app.get("/statuses", authMiddlware, this.list);
    app.get("/status/:id", authMiddlware, this.find);
  }
}
