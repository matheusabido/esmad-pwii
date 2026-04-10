import type { Express } from "express";
import UserController from "./user_controller.js";
import StatusController from "./status_controller.js";
import CategoryController from "./category_controller.js";
import BuildingController from "./building_controller.js";
import IncidentController from "./incident_controller.js";

export default interface Controller {
  registerRoutes(app: Express): void;
}

export function registerRoutes(app: Express) {
  const controllers = [
    new UserController(),
    new StatusController(),
    new CategoryController(),
    new BuildingController(),
    new IncidentController(),
  ];

  controllers.forEach((c) => c.registerRoutes(app));
  app.all("/{*wildcard}", (req, res) => {
    res.status(404).end();
  });
}
