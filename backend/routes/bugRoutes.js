import express from "express";
import {
  createBug,
  getBugs,
  getBug,
  updateBug,
  changeStatus,
  assignBug,
  deleteBug,
  toggleWatch,
  getMyBugs,
  getWatchedBugs,
  getRecentlyClosed,
  addAttachment,
  removeAttachment,
} from "../controllers/bugController.js";
import { addComment, getComments } from "../controllers/commentController.js";
import { protect, authorize } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

router.use(protect);

// Workspace endpoints
router.get("/my-bugs", getMyBugs);
router.get("/watched", getWatchedBugs);
router.get("/recently-closed", getRecentlyClosed);

router.route("/").get(getBugs).post(createBug);
router.route("/:id").get(getBug).patch(updateBug).delete(authorize("admin"), deleteBug);
router.patch("/:id/status", changeStatus);
router.patch("/:id/assign", authorize("admin", "developer"), assignBug);
router.post("/:id/watch", toggleWatch);

// Attachments
router.post("/:id/attachments", upload.single("file"), addAttachment);
router.delete("/:id/attachments/:attachmentId", removeAttachment);

// Comments
router.route("/:bugId/comments").get(getComments).post(addComment);

export default router;
