import type { Express, Request, Response } from "express";
import type Controller from "./controller.js";
import z from "zod";
import User from "@/models/user.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const storeValidator = z.object({
  email: z.email("E-mail inválido"),
  name: z
    .string("Nome deve ser uma string")
    .min(3, "O nome deve conter no mínimo 3 caracteres"),
  password: z
    .string("A senha deve ser uma string")
    .min(8, "A senha deve conter no mínimo 8 caracteres"),
});

const loginValidator = z.object({
  email: z.email("E-mail inválido"),
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

    const token = jwt.sign(
      {
        id: user.id,
      },
      process.env.JWT_SECRET!,
      { expiresIn: "1d", algorithm: "HS256", issuer: "pwii" },
    );

    return res.status(201).json({
      id: user.id,
      email: user.email,
      name: user.name,
      status: user.status,
      role: user.role,
      token,
    });
  }

  async login(req: Request, res: Response) {
    const body = loginValidator.parse(req.body);

    const user = await User.findOne({
      where: {
        email: body.email,
      },
    });

    if (!user) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    const isMatch = await bcrypt.compare(body.password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    const token = jwt.sign(
      {
        id: user.id,
      },
      process.env.JWT_SECRET!,
      { expiresIn: "1min", algorithm: "HS256", issuer: "pwii" },
    );

    return res.status(200).json({
      id: user.id,
      email: user.email,
      name: user.name,
      status: user.status,
      role: user.role,
      token,
    });
  }

  registerRoutes(app: Express): void {
    app.post("/user", this.store);
    app.post("/login", this.login);
  }
}
