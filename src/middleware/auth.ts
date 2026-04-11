import User from "@/models/user.js";
import { AppError } from "@/utils/errors.js";
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export async function authMiddlware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const token = req.header("Authorization")?.split(" ")[1];
  if (!token) {
    throw new AppError(401, "Não autenticado");
  }

  const payload = jwt.verify(token, process.env.JWT_SECRET!, {
    algorithms: ["HS256"],
    issuer: "pwii",
  }) as jwt.JwtPayload;

  req.user_id = payload.id;

  const user = await User.findByPk(req.user_id);
  if (!user) {
    throw new AppError(404, "Usuário não encontrado");
  }

  if (user.status !== "active") {
    throw new AppError(403, "Usuário inativo");
  }

  req.user = user;
  next();
}
