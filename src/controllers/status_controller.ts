import type { Express, Request, Response } from "express";
import type Controller from "./controller.js";
import Status from "@/models/status.js";
import z from "zod";
import { Op, type WhereOptions } from "sequelize";
import { authMiddlware } from "@/middleware/auth.js";

const listValidator = z.object({
  name: z.string("O nome deve ser um texto").trim().optional(),
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

const storeValidator = z.object({
  name: z
    .string("O nome deve ser um texto")
    .trim()
    .min(3, "O nome deve ter no mínimo 3 caracteres")
    .max(32, "O nome deve ter no máximo 32 caracteres"),
  description: z
    .string("A descrição deve ser um texto")
    .trim()
    .min(8, "A descrição deve ter no mínimo 8 caracteres")
    .max(255, "A descrição deve ter no máximo 255 caracteres"),
  color: z
    .hex("Cor deve ser um código hexadecimal")
    .length(6, "A cor deve ser uma cor válida."),
});

const patchValidator = z.object({
  name: z
    .string("O nome deve ser um texto")
    .trim()
    .min(3, "O nome deve ter no mínimo 3 caracteres")
    .max(32, "O nome deve ter no máximo 32 caracteres")
    .optional(),
  description: z
    .string("A descrição deve ser um texto")
    .trim()
    .min(8, "A descrição deve ter no mínimo 8 caracteres")
    .max(255, "A descrição deve ter no máximo 255 caracteres")
    .optional(),
  color: z
    .hex("Cor deve ser um código hexadecimal")
    .length(6, "A cor deve ser uma cor válida.")
    .optional(),
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

  async store(req: Request, res: Response) {
    if (req.user!.role !== "admin") {
      return res.status(403).json({ error: "Acesso não autorizado" });
    }

    const { name, description, color } = storeValidator.parse(req.body);
    const status = await Status.create({ name, description, color });

    return res.status(201).json({
      id: status.id,
      name: status.name,
      description: status.description,
      color: status.color,
    });
  }

  async patch(req: Request, res: Response) {
    if (req.user!.role !== "admin") {
      return res.status(403).json({ error: "Acesso não autorizado" });
    }

    const { id } = findValidator.parse(req.params);
    const { name, description, color } = patchValidator.parse(req.body);

    const status = await Status.findByPk(id);
    if (!status) {
      return res.status(404).json({ error: "Status não encontrado" });
    }

    if (name) status.name = name;
    if (description) status.description = description;
    if (color) status.color = color;

    await status.save();

    return res.status(200).json({
      id: status.id,
      name: status.name,
      description: status.description,
      color: status.color,
    });
  }

  async delete(req: Request, res: Response) {
    if (req.user!.role !== "admin") {
      return res.status(403).json({ error: "Acesso não autorizado" });
    }

    const { id } = findValidator.parse(req.params);

    const status = await Status.findByPk(id);
    if (!status) {
      return res.status(404).json({ error: "Status não encontrado" });
    }

    await status.destroy();
    return res.status(204).send();
  }

  registerRoutes(app: Express): void {
    app.get("/statuses", authMiddlware, this.list);
    app.get("/status/:id", authMiddlware, this.find);
    app.post("/status", authMiddlware, this.store);
    app.patch("/status/:id", authMiddlware, this.patch);
    app.delete("/status/:id", authMiddlware, this.delete);
  }
}
