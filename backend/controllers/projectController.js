import mongoose from "mongoose";
import Project from "../models/Project.js";
import Bug from "../models/Bug.js";
import ActivityLog from "../models/ActivityLog.js";
import Notification from "../models/Notification.js";

export const createProject = async (req, res, next) => {
  try {
    const { name, key, description, members, lead } = req.body;
    if (!name || !key) {
      return res.status(400).json({ message: "Project name and key are required" });
    }

    const normalizedKey = key.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (normalizedKey.length < 2 || normalizedKey.length > 6) {
      return res.status(400).json({ message: "Project key must be 2-6 alphanumeric characters" });
    }

    const existing = await Project.findOne({ key: normalizedKey });
    if (existing) {
      return res.status(400).json({ message: `Project key '${normalizedKey}' already exists` });
    }

    const projectLead = lead || req.user._id;
    const memberList = members || [];
    // Ensure lead is always in members
    if (!memberList.includes(projectLead.toString())) {
      memberList.push(projectLead);
    }
    // Ensure creator is in members
    if (!memberList.includes(req.user._id.toString())) {
      memberList.push(req.user._id);
    }

    const project = await Project.create({
      name,
      key: normalizedKey,
      description,
      lead: projectLead,
      members: memberList,
    });

    const populated = await Project.findById(project._id)
      .populate("lead", "name email")
      .populate("members", "name email role");

    res.status(201).json({ project: populated });
  } catch (err) {
    next(err);
  }
};

export const getProjects = async (req, res, next) => {
  try {
    const { archived } = req.query;
    const filter = {};

    if (archived === "true") {
      filter.isArchived = true;
    } else if (archived === "all") {
      // no filter
    } else {
      filter.isArchived = false;
    }

    const projects = await Project.find(filter)
      .populate("lead", "name email")
      .populate("members", "name email role")
      .sort({ createdAt: -1 });

    // attach bug counts
    const withCounts = await Promise.all(
      projects.map(async (p) => {
        const total = await Bug.countDocuments({ project: p._id });
        const open = await Bug.countDocuments({
          project: p._id,
          status: { $in: ["open", "in_progress", "in_review", "reopened"] },
        });
        const resolved = await Bug.countDocuments({ project: p._id, status: "resolved" });
        const closed = await Bug.countDocuments({ project: p._id, status: "closed" });
        return { ...p.toObject(), bugCount: total, openBugCount: open, resolvedBugCount: resolved, closedBugCount: closed };
      })
    );

    res.json({ projects: withCounts });
  } catch (err) {
    next(err);
  }
};

export const getProject = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid project ID" });
    }

    const project = await Project.findById(req.params.id)
      .populate("lead", "name email role")
      .populate("members", "name email role avatarInitials");

    if (!project) return res.status(404).json({ message: "Project not found" });

    const bugStats = await Bug.aggregate([
      { $match: { project: project._id } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    res.json({ project, bugStats });
  } catch (err) {
    next(err);
  }
};

export const updateProject = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid project ID" });
    }

    const { name, description, lead, isArchived } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    if (lead) project.lead = lead;
    if (isArchived !== undefined) project.isArchived = isArchived;

    await project.save();

    const populated = await Project.findById(project._id)
      .populate("lead", "name email role")
      .populate("members", "name email role avatarInitials");

    res.json({ project: populated });
  } catch (err) {
    next(err);
  }
};

export const addMember = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid project ID" });
    }

    const { userId } = req.body;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Valid user ID is required" });
    }

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const alreadyMember = project.members.some((m) => m.toString() === userId);
    if (alreadyMember) {
      return res.status(400).json({ message: "User is already a member of this project" });
    }

    project.members.push(userId);
    await project.save();

    // Notify the added user
    try {
      await Notification.create({
        recipient: userId,
        type: "project_member_added",
        title: "Added to project",
        message: `You were added to project ${project.name}`,
        project: project._id,
        actor: req.user._id,
      });
    } catch (e) { /* notification failure should not break the operation */ }

    const populated = await Project.findById(project._id)
      .populate("lead", "name email role")
      .populate("members", "name email role avatarInitials");

    res.json({ project: populated });
  } catch (err) {
    next(err);
  }
};

export const removeMember = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid project ID" });
    }

    const { userId } = req.body;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Valid user ID is required" });
    }

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    if (project.lead.toString() === userId) {
      return res.status(400).json({ message: "Cannot remove the project lead from members" });
    }

    project.members = project.members.filter((m) => m.toString() !== userId);
    await project.save();

    // Notify the removed user
    try {
      await Notification.create({
        recipient: userId,
        type: "project_member_removed",
        title: "Removed from project",
        message: `You were removed from project ${project.name}`,
        project: project._id,
        actor: req.user._id,
      });
    } catch (e) { /* notification failure should not break the operation */ }

    const populated = await Project.findById(project._id)
      .populate("lead", "name email role")
      .populate("members", "name email role avatarInitials");

    res.json({ project: populated });
  } catch (err) {
    next(err);
  }
};
