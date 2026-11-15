import express from "express";
import {
  createProject,
  getProjects,
  getProject,
  updateProject,
  addMember,
  removeMember,
} from "../controllers/projectController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.route("/").get(getProjects).post(authorize("admin", "developer"), createProject);
router.route("/:id").get(getProject).patch(authorize("admin", "developer"), updateProject);
router.post("/:id/members", authorize("admin", "developer"), addMember);
router.delete("/:id/members", authorize("admin", "developer"), removeMember);

export default router;
