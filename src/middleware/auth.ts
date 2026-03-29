import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export async function authMiddlware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const token = req.header("Authorization")?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Não autenticado." });
  }

  const payload = jwt.verify(token, process.env.JWT_SECRET!, {
    algorithms: ["HS256"],
    issuer: "pwii",
  }) as jwt.JwtPayload;

  return res.send(payload);
}
