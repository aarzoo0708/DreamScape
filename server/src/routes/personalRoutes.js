import { Router } from "express";
import { isDatabaseConnected } from "../config/db.js";
import {
  createDreamGoal,
  createFutureLetter,
  createGratitudeEntry,
  createJournalEntry,
  deleteDreamGoal,
  deleteFutureLetter,
  deleteGratitudeEntry,
  deleteJournalEntry,
  getDreamGoal,
  getFutureLetter,
  getGratitudeEntry,
  getJournalEntry,
  getPersonalSettings,
  listDreamGoals,
  listFutureLetters,
  listGratitudeEntries,
  listJournalEntries,
  updateDreamGoal,
  updateFutureLetter,
  updateGratitudeEntry,
  updateJournalEntry,
  updatePersonalSettings,
} from "../controllers/personalController.js";

const router = Router();

router.use((request, response, next) => {
  if (!isDatabaseConnected()) {
    return response.status(503).json({ success: false, message: "Database unavailable. Please try again shortly." });
  }
  return next();
});

router.get("/settings", getPersonalSettings);
router.put("/settings", updatePersonalSettings);

router.get("/journal", listJournalEntries);
router.post("/journal", createJournalEntry);
router.get("/journal/:id", getJournalEntry);
router.put("/journal/:id", updateJournalEntry);
router.delete("/journal/:id", deleteJournalEntry);

router.get("/letters", listFutureLetters);
router.post("/letters", createFutureLetter);
router.get("/letters/:id", getFutureLetter);
router.put("/letters/:id", updateFutureLetter);
router.delete("/letters/:id", deleteFutureLetter);

router.get("/goals", listDreamGoals);
router.post("/goals", createDreamGoal);
router.get("/goals/:id", getDreamGoal);
router.put("/goals/:id", updateDreamGoal);
router.delete("/goals/:id", deleteDreamGoal);

router.get("/gratitude", listGratitudeEntries);
router.post("/gratitude", createGratitudeEntry);
router.get("/gratitude/:id", getGratitudeEntry);
router.put("/gratitude/:id", updateGratitudeEntry);
router.delete("/gratitude/:id", deleteGratitudeEntry);

export default router;
