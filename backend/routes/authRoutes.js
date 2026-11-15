import express from "express";
import {
  register,
  login,
  getMe,
  listUsers,
  updateUserRole,
  toggleUserActive,
  getUser,
} from "../controllers/authController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getMe);
router.get("/users", protect, listUsers);
router.get("/users/:id", protect, authorize("admin"), getUser);
router.patch("/users/:id/role", protect, authorize("admin"), updateUserRole);
router.patch("/users/:id/toggle-active", protect, authorize("admin"), toggleUserActive);

export default router;
