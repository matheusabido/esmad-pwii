import type { Express, Request, Response } from "express";
import type Controller from "./controller.js";
import z from "zod";
import Incident from "@/models/incident.js";
import { AppError } from "@/utils/errors.js";

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

export default class CommentsController implements Controller {
  async store(req: Request, res: Response) {
    const { incidentId, comment } = storeValidator.parse(req.body);

    const incident = await Incident.findByPk(incidentId, { raw: true });
    if (!incident) {
      throw new AppError(404, "Incidente não encontrado");
    }
  }

  registerRoutes(app: Express): void {}
}
