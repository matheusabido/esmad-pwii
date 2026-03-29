import type { Express } from "express";
import UserController from "./user_controller.js";
import TestController from "./test_controller.js";

export default interface Controller {
  registerRoutes(app: Express): void;
}

export function registerRoutes(app: Express) {
  const controllers = [new UserController(), new TestController()];

  controllers.forEach((c) => c.registerRoutes(app));
}
