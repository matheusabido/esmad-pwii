import type User from "@/models/user.ts";
import "express";

declare global {
  namespace Express {
    interface Request {
      user_id?: number;
      user?: User;
    }
  }
}
