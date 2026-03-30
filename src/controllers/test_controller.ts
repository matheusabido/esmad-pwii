import type { Express, Request, Response } from "express";
import type Controller from "./controller.js";
import upload from "@/service/upload.js";
import fs from "fs/promises";
import logger from "@/service/logger.js";
import { authMiddlware } from "@/middleware/auth.js";

export default class TestController implements Controller {
  async handleFile(req: Request, res: Response) {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    console.log(req.file);

    try {
      await fs.rm(req.file.path);
      logger.debug(`File deleted: ${req.file.path}`);
    } catch (error) {
      logger.error(error, "Error deleting file");
    }
    return res.json({ message: "File handled successfully" });
  }

  async helloWorld(req: Request, res: Response) {
    return res.json({ message: `Hello, ${req.user?.name}!` });
  }

  registerRoutes(app: Express): void {
    app.get("/hello", authMiddlware, this.helloWorld);
    app.post("/file", upload.single("test_file"), this.handleFile);
  }
}
