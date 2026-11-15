import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/User.js";

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

export const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "An account with this email already exists" });
    }

    // Prevent public registration from creating admin accounts
    const allowedRoles = ["developer", "tester", "reporter"];
    const finalRole = allowedRoles.includes(role) ? role : "reporter";

    const user = await User.create({ name, email, password, role: finalRole });

    const token = signToken(user._id);
    res.status(201).json({ token, user: user.toSafeObject() });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "This account has been deactivated" });
    }

    const token = signToken(user._id);
    res.json({ token, user: user.toSafeObject() });
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req, res, next) => {
  try {
    res.json({ user: req.user.toSafeObject() });
  } catch (err) {
    next(err);
  }
};

export const listUsers = async (req, res, next) => {
  try {
    const { search, role, active } = req.query;
    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }
    if (role) filter.role = role;
    if (active !== undefined) filter.isActive = active === "true";

    const users = await User.find(filter).select("name email role isActive avatarInitials createdAt").sort({ createdAt: -1 });
    res.json({ users });
  } catch (err) {
    next(err);
  }
};

// Admin: update user role
export const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const validRoles = ["admin", "developer", "tester", "reporter"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: `Invalid role. Must be one of: ${validRoles.join(", ")}` });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Prevent last admin from losing admin role
    if (user.role === "admin" && role !== "admin") {
      const adminCount = await User.countDocuments({ role: "admin", isActive: true });
      if (adminCount <= 1) {
        return res.status(400).json({ message: "Cannot remove the last admin" });
      }
    }

    user.role = role;
    await user.save();
    res.json({ user: user.toSafeObject() });
  } catch (err) {
    next(err);
  }
};

// Admin: activate/deactivate user
export const toggleUserActive = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Prevent deactivating self
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "Cannot deactivate your own account" });
    }

    // Prevent deactivating last admin
    if (user.role === "admin" && user.isActive) {
      const adminCount = await User.countDocuments({ role: "admin", isActive: true });
      if (adminCount <= 1) {
        return res.status(400).json({ message: "Cannot deactivate the last admin" });
      }
    }

    user.isActive = !user.isActive;
    await user.save();
    res.json({ user: user.toSafeObject() });
  } catch (err) {
    next(err);
  }
};

// Admin: get single user details with project membership
export const getUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await User.findById(id).select("name email role isActive avatarInitials createdAt");
    if (!user) return res.status(404).json({ message: "User not found" });

    // Get projects user is a member of
    const Project = (await import("../models/Project.js")).default;
    const projects = await Project.find({
      $or: [{ members: id }, { lead: id }],
      isArchived: false,
    }).select("name key");

    res.json({ user, projects });
  } catch (err) {
    next(err);
  }
};
