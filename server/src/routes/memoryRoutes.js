import { Router } from "express";
import { isDatabaseConnected } from "../config/db.js";
import {
  createMemory,
  deleteMemory,
  getMemory,
  listMemories,
  updateMemory,
} from "../controllers/memoryController.js";

const router = Router();

router.use((request, response, next) => {
  if (!isDatabaseConnected()) {
    return response.status(503).json({
      success: false,
      message: "Database unavailable. Please try again shortly.",
    });
  }
  return next();
});

router.get("/", listMemories);
router.get("/:id", getMemory);
router.post("/", createMemory);
router.put("/:id", updateMemory);
router.delete("/:id", deleteMemory);

export default router;
