import type { Express, Request, Response } from "express";
import type Controller from "./controller.js";
import z from "zod";
import { Op, type WhereOptions } from "sequelize";
import Category from "@/models/category.js";
import { authMiddlware } from "@/middleware/auth.js";
import { paginate } from "@/utils/paginate.js";

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

export default class CategoryController implements Controller {
  async list(req: Request, res: Response) {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ error: "Acesso negado" });
    }

    const { name, page } = listValidator.parse(req.query);

    const where: WhereOptions<any> = {};
    if (name) where.name = { [Op.iLike]: `%${name}%` };

    const { rows, count } = await Category.findAndCountAll({
      where: where,
      offset: (page - 1) * 20,
      limit: 20,
    });

    return res.status(200).json(paginate({ rows, total: count, page }));
  }

  async find(req: Request, res: Response) {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ error: "Acesso negado" });
    }

    const { id } = findValidator.parse(req.params);

    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).json({ error: "Categoria não encontrada" });
    }

    return res.status(200).json(category);
  }

  async store(req: Request, res: Response) {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ error: "Acesso negado" });
    }

    const { name, description, color } = storeValidator.parse(req.body);

    const category = await Category.create({
      name,
      description,
      color,
    });

    return res.status(201).json(category);
  }

  async patch(req: Request, res: Response) {
    if (req.user!.role !== "admin") {
      return res.status(403).json({ error: "Acesso não autorizado" });
    }

    const { id } = findValidator.parse(req.params);
    const { name, description, color } = patchValidator.parse(req.body);

    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).json({ error: "Categoria não encontrada" });
    }

    await category.update({
      name: name ?? category.name,
      description: description ?? category.description,
      color: color ?? category.color,
    });

    return res.status(200).json(category);
  }

  async delete(req: Request, res: Response) {
    if (req.user!.role !== "admin") {
      return res.status(403).json({ error: "Acesso não autorizado" });
    }

    const { id } = findValidator.parse(req.params);

    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).json({ error: "Categoria não encontrada" });
    }

    await category.destroy();
    return res.status(204).send();
  }

  registerRoutes(app: Express): void {
    app.get("/categories", authMiddlware, this.list);
    app.get("/category/:id", authMiddlware, this.find);
    app.post("/category", authMiddlware, this.store);
    app.patch("/category/:id", authMiddlware, this.patch);
    app.delete("/category/:id", authMiddlware, this.delete);
  }
}
