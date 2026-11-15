import express from "express";
import { deleteComment, updateComment } from "../controllers/commentController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();
router.use(protect);
router.route("/:id").patch(updateComment).delete(deleteComment);

export default router;
