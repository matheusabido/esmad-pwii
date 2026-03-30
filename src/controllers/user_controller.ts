import type { Express, Request, Response } from "express";
import type Controller from "./controller.js";
import z, { email } from "zod";
import User from "@/models/user.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { AVAILABLE_STATUSES, type Status } from "@/enum/status.js";
import { AVAILABLE_ROLES } from "@/enum/role.js";
import { Op, type WhereOptions } from "sequelize";
import { authMiddlware } from "@/middleware/auth.js";

const storeValidator = z.object({
  email: z.email("E-mail inválido").trim(),
  name: z
    .string("Nome deve ser uma string")
    .trim()
    .min(3, "O nome deve conter no mínimo 3 caracteres"),
  password: z
    .string("A senha deve ser uma string")
    .trim()
    .min(8, "A senha deve conter no mínimo 8 caracteres"),
});

const loginValidator = z.object({
  email: z.email("E-mail inválido").trim(),
  password: z
    .string("A senha deve ser uma string")
    .trim()
    .min(8, "A senha deve conter no mínimo 8 caracteres"),
});

const findValidator = z.object({
  id: z.coerce
    .number("ID deve ser um número")
    .int("ID deve ser um número inteiro")
    .positive("ID deve ser um número positivo"),
});

const patchValidator = z.object({
  id: z.coerce
    .number("ID deve ser um número")
    .int("ID deve ser um número inteiro")
    .positive("ID deve ser um número positivo"),
  name: z
    .string("Nome deve ser uma string")
    .trim()
    .min(3, "O nome deve conter no mínimo 3 caracteres")
    .optional(),
  password: z
    .string("A senha deve ser uma string")
    .trim()
    .min(8, "A senha deve conter no mínimo 8 caracteres")
    .optional(),
  status: z.enum(AVAILABLE_STATUSES).optional(),
  role: z.enum(AVAILABLE_ROLES).optional(),
});

const listValidator = z.object({
  page: z.coerce
    .number()
    .int("Page deve ser um número inteiro")
    .positive("Page deve ser um número positivo")
    .optional()
    .default(1),
  role: z.enum(AVAILABLE_ROLES, "Tipo de usuário inválido").optional(),
  status: z.enum(AVAILABLE_STATUSES, "Status inválido").optional(),
  name: z.string().trim().optional(),
});

export default class UserController implements Controller {
  async find(req: Request, res: Response) {
    const { id } = findValidator.parse(req.params);

    console.log(req.user);
    if (req.user!.id !== id && req.user!.role !== "admin") {
      return res.status(403).json({ error: "Acesso não autorizado" });
    }

    const user = await User.findByPk(id, {
      attributes: ["id", "email", "name", "status", "role"],
    });
    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    return res.status(200).json(user);
  }

  async list(req: Request, res: Response) {
    if (req.user!.role !== "admin") {
      return res.status(403).json({ error: "Acesso não autorizado" });
    }

    const { page, role, status, name } = listValidator.parse(req.query);

    const where: WhereOptions<any> = {};
    if (role) where.role = role;
    if (status) where.status = status;
    if (name) where.name = { [Op.like]: `%${name}%` };

    const { rows, count } = await User.findAndCountAll({
      limit: 20,
      offset: (page - 1) * 20,
      where,
      attributes: ["id", "email", "name", "status", "role"],
    });

    return res.status(200).json({
      data: rows,
      meta: {
        total: count,
        page,
        lastPage: Math.ceil(count / 20),
      },
    });
  }

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

  async patch(req: Request, res: Response) {
    const { id, name, password, status, role } = patchValidator.parse({
      ...req.params,
      ...req.body,
    });

    if (req.user!.id !== id && req.user!.role !== "admin") {
      return res.status(403).json({ error: "Acesso não autorizado" });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    if (name) user.name = name;
    if (password) user.password = password;
    if (user.role === "admin") {
      if (status) user.status = status;
      if (role) user.role = role;
    }

    await user.save();

    res.status(200).json({
      id: user.id,
      email: user.email,
      name: user.name,
      status: user.status,
      role: user.role,
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
      { expiresIn: "1h", algorithm: "HS256", issuer: "pwii" },
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
    app.get("/users", authMiddlware, this.list);
    app.get("/user/:id", authMiddlware, this.find);
    app.post("/user", this.store);
    app.post("/login", this.login);
    app.patch("/user/:id", authMiddlware, this.patch);
  }
}
