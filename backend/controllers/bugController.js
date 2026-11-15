import mongoose from "mongoose";
import Bug from "../models/Bug.js";
import Project from "../models/Project.js";
import ActivityLog from "../models/ActivityLog.js";
import Notification from "../models/Notification.js";

// valid forward transitions for status workflow
const TRANSITIONS = {
  open: ["in_progress", "closed"],
  in_progress: ["in_review", "open", "closed"],
  in_review: ["resolved", "in_progress"],
  resolved: ["closed", "reopened"],
  closed: ["reopened"],
  reopened: ["in_progress", "closed"],
};

const logActivity = (bugId, actor, action, fromValue = null, toValue = null, meta = "") =>
  ActivityLog.create({ bug: bugId, actor, action, fromValue, toValue, meta });

const notifyUsers = async (recipients, type, title, message, bugId, projectId, actorId) => {
  try {
    const uniqueRecipients = [...new Set(recipients.map((r) => r.toString()))].filter(
      (r) => r !== actorId.toString()
    );
    if (uniqueRecipients.length === 0) return;
    await Notification.insertMany(
      uniqueRecipients.map((r) => ({
        recipient: r,
        type,
        title,
        message,
        bug: bugId,
        project: projectId,
        actor: actorId,
      }))
    );
  } catch (e) {
    /* notification failure should not break operations */
  }
};

export const createBug = async (req, res, next) => {
  try {
    const {
      title,
      description,
      stepsToReproduce,
      expectedResult,
      actualResult,
      project: projectId,
      priority,
      severity,
      assignedTo,
      labels,
      dueDate,
    } = req.body;

    if (!title || !projectId) {
      return res.status(400).json({ message: "Title and project are required" });
    }
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: "Invalid project ID" });
    }

    // Atomic increment of bugSequence to avoid race conditions
    const project = await Project.findByIdAndUpdate(
      projectId,
      { $inc: { bugSequence: 1 } },
      { new: true }
    );
    if (!project) return res.status(404).json({ message: "Project not found" });

    const bugId = `${project.key}-${project.bugSequence}`;

    const bug = await Bug.create({
      bugId,
      title,
      description,
      stepsToReproduce,
      expectedResult,
      actualResult,
      project: projectId,
      reportedBy: req.user._id,
      assignedTo: assignedTo || null,
      priority,
      severity,
      labels,
      dueDate,
      watchers: [req.user._id], // reporter auto-watches
    });

    await logActivity(bug._id, req.user._id, "created", null, bug.status, `Bug ${bugId} created`);

    // Notify assignee if assigned
    if (assignedTo) {
      await notifyUsers(
        [assignedTo],
        "bug_assigned",
        "Bug assigned to you",
        `${bugId}: ${title}`,
        bug._id,
        projectId,
        req.user._id
      );
    }

    const populated = await bug.populate([
      { path: "reportedBy", select: "name email role" },
      { path: "assignedTo", select: "name email role" },
      { path: "project", select: "name key" },
    ]);

    res.status(201).json({ bug: populated });
  } catch (err) {
    next(err);
  }
};

export const getBugs = async (req, res, next) => {
  try {
    const {
      project,
      status,
      priority,
      severity,
      assignedTo,
      reportedBy,
      search,
      sort: sortField,
      sprint,
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {};
    if (project) {
      if (mongoose.Types.ObjectId.isValid(project)) filter.project = project;
    }
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (severity) filter.severity = severity;
    if (assignedTo) {
      if (assignedTo === "unassigned") {
        filter.assignedTo = null;
      } else if (mongoose.Types.ObjectId.isValid(assignedTo)) {
        filter.assignedTo = assignedTo;
      }
    }
    if (reportedBy && mongoose.Types.ObjectId.isValid(reportedBy)) {
      filter.reportedBy = reportedBy;
    }
    if (sprint) {
      if (mongoose.Types.ObjectId.isValid(sprint)) filter.sprint = sprint;
    }
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { bugId: { $regex: search, $options: "i" } },
      ];
    }

    // Clamp limit
    const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const skip = (Math.max(Number(page) || 1, 1) - 1) * safeLimit;

    // Sorting
    let sortObj = { createdAt: -1 };
    if (sortField === "priority") sortObj = { priority: 1, createdAt: -1 };
    else if (sortField === "dueDate") sortObj = { dueDate: 1, createdAt: -1 };
    else if (sortField === "updatedAt") sortObj = { updatedAt: -1 };

    const [bugs, total] = await Promise.all([
      Bug.find(filter)
        .populate("reportedBy", "name email role avatarInitials")
        .populate("assignedTo", "name email role avatarInitials")
        .populate("project", "name key")
        .sort(sortObj)
        .skip(skip)
        .limit(safeLimit),
      Bug.countDocuments(filter),
    ]);

    res.json({
      bugs,
      total,
      page: Math.max(Number(page) || 1, 1),
      pages: Math.ceil(total / safeLimit),
    });
  } catch (err) {
    next(err);
  }
};

export const getBug = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid bug ID" });
    }

    const bug = await Bug.findById(req.params.id)
      .populate("reportedBy", "name email role avatarInitials")
      .populate("assignedTo", "name email role avatarInitials")
      .populate("project", "name key members lead")
      .populate("watchers", "name email avatarInitials")
      .populate("sprint", "name status startDate endDate");

    if (!bug) return res.status(404).json({ message: "Bug not found" });

    const activity = await ActivityLog.find({ bug: bug._id })
      .populate("actor", "name role avatarInitials")
      .sort({ createdAt: -1 });

    res.json({ bug, activity });
  } catch (err) {
    next(err);
  }
};

export const updateBug = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid bug ID" });
    }

    const bug = await Bug.findById(req.params.id);
    if (!bug) return res.status(404).json({ message: "Bug not found" });

    const { title, description, stepsToReproduce, expectedResult, actualResult, priority, severity, labels, dueDate } = req.body;

    if (title !== undefined) bug.title = title;
    if (description !== undefined) bug.description = description;
    if (stepsToReproduce !== undefined) bug.stepsToReproduce = stepsToReproduce;
    if (expectedResult !== undefined) bug.expectedResult = expectedResult;
    if (actualResult !== undefined) bug.actualResult = actualResult;
    if (labels !== undefined) bug.labels = labels;
    if (dueDate !== undefined) bug.dueDate = dueDate;

    let priorityChanged = false;
    let severityChanged = false;

    if (priority && priority !== bug.priority) {
      await logActivity(bug._id, req.user._id, "priority_changed", bug.priority, priority);
      bug.priority = priority;
      priorityChanged = true;
    }
    if (severity && severity !== bug.severity) {
      await logActivity(bug._id, req.user._id, "severity_changed", bug.severity, severity);
      bug.severity = severity;
      severityChanged = true;
    }

    await bug.save();

    // Only log generic "updated" if fields other than priority/severity changed
    const otherFieldsChanged = title !== undefined || description !== undefined ||
      stepsToReproduce !== undefined || expectedResult !== undefined ||
      actualResult !== undefined || labels !== undefined || dueDate !== undefined;
    if (otherFieldsChanged && !priorityChanged && !severityChanged) {
      await logActivity(bug._id, req.user._id, "updated", null, null, "Bug details updated");
    }

    const populated = await bug.populate([
      { path: "reportedBy", select: "name email role" },
      { path: "assignedTo", select: "name email role" },
      { path: "project", select: "name key" },
    ]);

    res.json({ bug: populated });
  } catch (err) {
    next(err);
  }
};

export const changeStatus = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid bug ID" });
    }

    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    const bug = await Bug.findById(req.params.id);
    if (!bug) return res.status(404).json({ message: "Bug not found" });

    const allowed = TRANSITIONS[bug.status] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        message: `Cannot move bug from '${bug.status}' to '${status}'. Allowed: ${allowed.join(", ") || "none"}`,
      });
    }

    const from = bug.status;
    bug.status = status;
    if (status === "resolved") bug.resolvedAt = new Date();
    if (status === "closed") bug.closedAt = new Date();
    if (status === "reopened") {
      bug.resolvedAt = null;
      bug.closedAt = null;
    }

    await bug.save();
    await logActivity(
      bug._id,
      req.user._id,
      status === "reopened" ? "reopened" : status === "closed" ? "closed" : "status_changed",
      from,
      status
    );

    // Notify watchers and assignee
    const recipients = [...(bug.watchers || [])];
    if (bug.assignedTo) recipients.push(bug.assignedTo);
    if (bug.reportedBy) recipients.push(bug.reportedBy);
    await notifyUsers(
      recipients,
      "bug_status_changed",
      "Bug status changed",
      `${bug.bugId} moved from ${from} to ${status}`,
      bug._id,
      bug.project,
      req.user._id
    );

    const populated = await bug.populate([
      { path: "reportedBy", select: "name email role" },
      { path: "assignedTo", select: "name email role" },
      { path: "project", select: "name key" },
    ]);

    res.json({ bug: populated });
  } catch (err) {
    next(err);
  }
};

export const assignBug = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid bug ID" });
    }

    const { userId } = req.body;
    const bug = await Bug.findById(req.params.id);
    if (!bug) return res.status(404).json({ message: "Bug not found" });

    const from = bug.assignedTo ? bug.assignedTo.toString() : null;
    const to = userId || null;

    if (to && !mongoose.Types.ObjectId.isValid(to)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    bug.assignedTo = to;
    await bug.save();

    await logActivity(
      bug._id,
      req.user._id,
      to ? "assigned" : "unassigned",
      from,
      to
    );

    // Notify the new assignee
    if (to) {
      const type = from ? "bug_reassigned" : "bug_assigned";
      await notifyUsers(
        [to],
        type,
        from ? "Bug reassigned to you" : "Bug assigned to you",
        `${bug.bugId}: ${bug.title}`,
        bug._id,
        bug.project,
        req.user._id
      );
    }

    const populated = await bug.populate([
      { path: "assignedTo", select: "name email role" },
      { path: "reportedBy", select: "name email role" },
      { path: "project", select: "name key" },
    ]);
    res.json({ bug: populated });
  } catch (err) {
    next(err);
  }
};

export const deleteBug = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid bug ID" });
    }

    const bug = await Bug.findById(req.params.id);
    if (!bug) return res.status(404).json({ message: "Bug not found" });

    // Delete associated comments and activity logs
    const Comment = (await import("../models/Comment.js")).default;
    await Comment.deleteMany({ bug: bug._id });
    await ActivityLog.deleteMany({ bug: bug._id });
    await Notification.deleteMany({ bug: bug._id });
    await bug.deleteOne();

    res.json({ message: "Bug deleted" });
  } catch (err) {
    next(err);
  }
};

// Toggle watch/unwatch
export const toggleWatch = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid bug ID" });
    }

    const bug = await Bug.findById(req.params.id);
    if (!bug) return res.status(404).json({ message: "Bug not found" });

    const userId = req.user._id.toString();
    const isWatching = bug.watchers.some((w) => w.toString() === userId);

    if (isWatching) {
      bug.watchers = bug.watchers.filter((w) => w.toString() !== userId);
    } else {
      bug.watchers.push(req.user._id);
    }

    await bug.save();
    res.json({ watching: !isWatching });
  } catch (err) {
    next(err);
  }
};

// Get bugs assigned to current user
export const getMyBugs = async (req, res, next) => {
  try {
    const bugs = await Bug.find({
      assignedTo: req.user._id,
      status: { $in: ["open", "in_progress", "in_review", "reopened"] },
    })
      .populate("project", "name key")
      .sort({ priority: -1, createdAt: -1 })
      .limit(50);
    res.json({ bugs });
  } catch (err) {
    next(err);
  }
};

// Get bugs user is watching
export const getWatchedBugs = async (req, res, next) => {
  try {
    const bugs = await Bug.find({
      watchers: req.user._id,
    })
      .populate("project", "name key")
      .populate("assignedTo", "name")
      .sort({ updatedAt: -1 })
      .limit(50);
    res.json({ bugs });
  } catch (err) {
    next(err);
  }
};

// Get recently closed bugs
export const getRecentlyClosed = async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const bugs = await Bug.find({
      status: "closed",
      closedAt: { $gte: thirtyDaysAgo },
    })
      .populate("project", "name key")
      .populate("assignedTo", "name")
      .sort({ closedAt: -1 })
      .limit(50);
    res.json({ bugs });
  } catch (err) {
    next(err);
  }
};

// Add attachment metadata to bug
export const addAttachment = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid bug ID" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const bug = await Bug.findById(req.params.id);
    if (!bug) return res.status(404).json({ message: "Bug not found" });

    const attachment = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      url: `/uploads/${req.file.filename}`,
      uploadedBy: req.user._id,
    };

    bug.attachments.push(attachment);
    await bug.save();

    res.status(201).json({ attachment: bug.attachments[bug.attachments.length - 1] });
  } catch (err) {
    next(err);
  }
};

// Remove attachment
export const removeAttachment = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid bug ID" });
    }

    const { attachmentId } = req.params;
    const bug = await Bug.findById(req.params.id);
    if (!bug) return res.status(404).json({ message: "Bug not found" });

    const attachment = bug.attachments.id(attachmentId);
    if (!attachment) return res.status(404).json({ message: "Attachment not found" });

    // Only uploader or admin can remove
    if (attachment.uploadedBy?.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to remove this attachment" });
    }

    bug.attachments.pull(attachmentId);
    await bug.save();

    // Try to delete file from disk
    try {
      const fs = await import("fs/promises");
      const path = await import("path");
      const uploadDir = process.env.UPLOAD_DIR || "uploads";
      await fs.unlink(path.join(uploadDir, attachment.filename));
    } catch (e) { /* file may not exist */ }

    res.json({ message: "Attachment removed" });
  } catch (err) {
    next(err);
  }
};
