import type { Express, Request, Response } from "express";
import type Controller from "./controller.js";
import z from "zod";
import User from "@/models/user.js";

const storeValidator = z.object({
  email: z.email("E-mail inválido"),
  name: z
    .string("Nome deve ser uma string")
    .min(3, "O nome deve conter no mínimo 3 caracteres"),
  password: z
    .string("A senha deve ser uma string")
    .min(8, "A senha deve conter no mínimo 8 caracteres"),
});

export default class UserController implements Controller {
  async store(req: Request, res: Response) {
    const body = storeValidator.parse(req.body);

    const user = await User.create({
      email: body.email,
      name: body.name,
      password: body.password,
      status: "pending",
      role: "student",
    });

    return res.status(201).json({
      id: user.id,
      email: user.email,
      name: user.name,
      status: user.status,
      role: user.role,
    });
  }

  registerRoutes(app: Express): void {
    app.post("/user", this.store);
  }
}
