import type { Express } from "express";

export default interface Controller {
  registerRoutes(app: Express): void;
}
