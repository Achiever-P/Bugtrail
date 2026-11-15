import express from "express";
import {
  createSprint,
  getSprints,
  getSprint,
  updateSprint,
  addBugToSprint,
  removeBugFromSprint,
  deleteSprint,
} from "../controllers/sprintController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();
router.use(protect);

router.route("/").get(getSprints).post(authorize("admin", "developer"), createSprint);
router
  .route("/:id")
  .get(getSprint)
  .patch(authorize("admin", "developer"), updateSprint)
  .delete(authorize("admin", "developer"), deleteSprint);
router.post("/:id/bugs", authorize("admin", "developer"), addBugToSprint);
router.delete("/:id/bugs", authorize("admin", "developer"), removeBugFromSprint);

export default router;
