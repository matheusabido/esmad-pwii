import type { Express, Request, Response } from "express";
import type Controller from "./controller.js";
import z from "zod";
import Incident from "@/models/incident.js";
import { AppError } from "@/utils/errors.js";
import Comment from "@/models/comment.js";
import User from "@/models/user.js";
import { authMiddlware } from "@/middleware/auth.js";
import { paginate } from "@/utils/paginate.js";

const storeValidator = z.object({
  incidentId: z.coerce
    .number("incidentId deve ser um número")
    .int("incidentId deve ser um número inteiro")
    .positive("incidentId deve um número positivo"),
  comment: z
    .string("O comentário deve ser um texto")
    .trim()
    .min(1, "O comentário deve ter pelo menos um caractere")
    .max(255, "O comentário deve ter no máximo 255 caracteres"),
});

const findValidator = z.object({
  id: z.coerce
    .number("id deve ser um número")
    .int("id deve ser um número inteiro")
    .positive("id deve um número positivo"),
});

const listValidator = z.object({
  incidentId: z.coerce
    .number("incidentId deve ser um número")
    .int("incidentId deve ser um número inteiro")
    .positive("incidentId deve um número positivo"),
  page: z.coerce
    .number("page deve ser um número")
    .int("page deve ser um número inteiro")
    .positive("page deve um número positivo")
    .default(1),
});

export default class CommentsController implements Controller {
  async list(req: Request, res: Response) {
    const { incidentId, page } = listValidator.parse(req.query);

    const incident = await Incident.findByPk(incidentId, { raw: true });
    if (!incident) {
      throw new AppError(404, "Incidente não encontrado");
    }

    const where: any = { incidentId };
    const { rows, count: total } = await Comment.findAndCountAll({
      where,
      include: [
        { model: User, as: "user", attributes: ["id", "name", "role"] },
      ],
      order: [["id", "ASC"]],
      offset: (page - 1) * 20,
      limit: 20,
    });

    return res.json(paginate({ rows, total, page }));
  }

  async find(req: Request, res: Response) {
    const { id } = findValidator.parse(req.params);

    const comment = await Comment.findByPk(id, {
      include: [
        { model: User, as: "user", attributes: ["id", "name", "role"] },
      ],
    });
    if (!comment) {
      throw new AppError(404, "Comentário não encontrado");
    }

    return res.json(comment);
  }

  async store(req: Request, res: Response) {
    const { incidentId, comment } = storeValidator.parse(req.body);

    const incident = await Incident.findByPk(incidentId, { raw: true });
    if (!incident) {
      throw new AppError(404, "Incidente não encontrado");
    }

    const c = await Comment.create({
      userId: req.user!.id,
      incidentId: incidentId,
      comment,
      status: "active",
    });

    return res.status(201).json(c);
  }

  async delete(req: Request, res: Response) {
    const { id } = findValidator.parse(req.params);

    const comment = await Comment.findByPk(id);
    if (!comment) {
      throw new AppError(404, "Comentário não encontrado");
    }

    if (req.user!.role !== "admin" && comment.userId !== req.user!.id) {
      throw new AppError(
        403,
        "Você não tem permissão para excluir este comentário",
      );
    }

    await comment.destroy();

    return res.status(204).send();
  }

  registerRoutes(app: Express): void {
    app.get("/comments", authMiddlware, this.list);
    app.get("/comment/:id", authMiddlware, this.find);
    app.post("/comment", authMiddlware, this.store);
    app.delete("/comment/:id", authMiddlware, this.delete);
  }
}
