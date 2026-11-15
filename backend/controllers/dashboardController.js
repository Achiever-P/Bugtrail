import mongoose from "mongoose";
import Bug from "../models/Bug.js";
import Project from "../models/Project.js";
import User from "../models/User.js";
import ActivityLog from "../models/ActivityLog.js";

export const getDashboardStats = async (req, res, next) => {
  try {
    const { project: projectFilter } = req.query;
    const bugFilter = {};
    let aggMatch = null;
    if (projectFilter && mongoose.Types.ObjectId.isValid(projectFilter)) {
      bugFilter.project = projectFilter;
      aggMatch = { $match: { project: new mongoose.Types.ObjectId(projectFilter) } };
    }

    const [totalBugs, openBugs, inProgressBugs, inReviewBugs, resolvedBugs, closedBugs, totalProjects, totalUsers] =
      await Promise.all([
        Bug.countDocuments(bugFilter),
        Bug.countDocuments({ ...bugFilter, status: "open" }),
        Bug.countDocuments({ ...bugFilter, status: "in_progress" }),
        Bug.countDocuments({ ...bugFilter, status: "in_review" }),
        Bug.countDocuments({ ...bugFilter, status: "resolved" }),
        Bug.countDocuments({ ...bugFilter, status: "closed" }),
        Project.countDocuments({ isArchived: false }),
        User.countDocuments({ isActive: true }),
      ]);

    const criticalBugs = await Bug.countDocuments({
      ...bugFilter,
      priority: "critical",
      status: { $in: ["open", "in_progress", "in_review", "reopened"] },
    });

    const overdueBugs = await Bug.countDocuments({
      ...bugFilter,
      dueDate: { $lt: new Date() },
      status: { $in: ["open", "in_progress", "in_review", "reopened"] },
    });

    const byStatus = await Bug.aggregate([
      ...(aggMatch ? [aggMatch] : []),
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const byPriority = await Bug.aggregate([
      ...(aggMatch ? [aggMatch] : []),
      { $group: { _id: "$priority", count: { $sum: 1 } } },
    ]);

    const bySeverity = await Bug.aggregate([
      ...(aggMatch ? [aggMatch] : []),
      { $group: { _id: "$severity", count: { $sum: 1 } } },
    ]);

    const byProject = await Bug.aggregate([
      { $group: { _id: "$project", count: { $sum: 1 } } },
      { $lookup: { from: "projects", localField: "_id", foreignField: "_id", as: "project" } },
      { $unwind: "$project" },
      { $project: { count: 1, name: "$project.name", key: "$project.key" } },
    ]);

    // Bugs by assignee (developer distribution)
    const byAssignee = await Bug.aggregate([
      { $match: { assignedTo: { $ne: null }, status: { $in: ["open", "in_progress", "in_review", "reopened"] } } },
      { $group: { _id: "$assignedTo", count: { $sum: 1 } } },
      { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
      { $unwind: "$user" },
      { $project: { count: 1, name: "$user.name" } },
      { $sort: { count: -1 } },
    ]);

    // Bugs created over time (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const bugsOverTime = await Bug.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const myAssigned = await Bug.countDocuments({
      assignedTo: req.user._id,
      status: { $in: ["open", "in_progress", "in_review", "reopened"] },
    });

    const recentBugs = await Bug.find(bugFilter)
      .populate("reportedBy", "name avatarInitials")
      .populate("assignedTo", "name avatarInitials")
      .populate("project", "name key")
      .sort({ createdAt: -1 })
      .limit(8);

    const recentlyUpdated = await Bug.find(bugFilter)
      .populate("reportedBy", "name")
      .populate("assignedTo", "name")
      .populate("project", "name key")
      .sort({ updatedAt: -1 })
      .limit(6);

    const recentActivity = await ActivityLog.find()
      .populate("actor", "name avatarInitials")
      .populate("bug", "bugId title")
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      totals: {
        totalBugs,
        openBugs,
        inProgressBugs,
        inReviewBugs,
        resolvedBugs,
        closedBugs,
        totalProjects,
        totalUsers,
        criticalBugs,
        overdueBugs,
        myAssigned,
      },
      byStatus,
      byPriority,
      bySeverity,
      byProject,
      byAssignee,
      bugsOverTime,
      recentBugs,
      recentlyUpdated,
      recentActivity,
    });
  } catch (err) {
    next(err);
  }
};
