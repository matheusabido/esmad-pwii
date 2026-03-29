import type { Express } from "express";
import UserController from "./user_controller.js";

export default interface Controller {
  registerRoutes(app: Express): void;
}

export function registerRoutes(app: Express) {
  const controllers = [new UserController()];

  controllers.forEach((c) => c.registerRoutes(app));
}
