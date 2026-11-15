import mongoose from "mongoose";
import Sprint from "../models/Sprint.js";
import Bug from "../models/Bug.js";
import Project from "../models/Project.js";

export const createSprint = async (req, res, next) => {
  try {
    const { name, project: projectId, description, startDate, endDate } = req.body;

    if (!name || !projectId || !startDate || !endDate) {
      return res.status(400).json({ message: "Name, project, start date, and end date are required" });
    }
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: "Invalid project ID" });
    }
    if (new Date(endDate) <= new Date(startDate)) {
      return res.status(400).json({ message: "End date must be after start date" });
    }

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const sprint = await Sprint.create({
      name,
      project: projectId,
      description,
      startDate,
      endDate,
      createdBy: req.user._id,
    });

    res.status(201).json({ sprint });
  } catch (err) {
    next(err);
  }
};

export const getSprints = async (req, res, next) => {
  try {
    const { project } = req.query;
    const filter = {};
    if (project && mongoose.Types.ObjectId.isValid(project)) {
      filter.project = project;
    }

    const sprints = await Sprint.find(filter)
      .populate("project", "name key")
      .populate("createdBy", "name")
      .sort({ startDate: -1 });

    // Add bug counts
    const withCounts = await Promise.all(
      sprints.map(async (s) => {
        const total = s.bugs.length;
        const completed = await Bug.countDocuments({
          _id: { $in: s.bugs },
          status: { $in: ["resolved", "closed"] },
        });
        return { ...s.toObject(), totalBugs: total, completedBugs: completed };
      })
    );

    res.json({ sprints: withCounts });
  } catch (err) {
    next(err);
  }
};

export const getSprint = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid sprint ID" });
    }

    const sprint = await Sprint.findById(req.params.id)
      .populate("project", "name key")
      .populate("createdBy", "name")
      .populate({
        path: "bugs",
        populate: [
          { path: "assignedTo", select: "name avatarInitials" },
          { path: "reportedBy", select: "name" },
        ],
      });

    if (!sprint) return res.status(404).json({ message: "Sprint not found" });
    res.json({ sprint });
  } catch (err) {
    next(err);
  }
};

export const updateSprint = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid sprint ID" });
    }

    const { name, description, startDate, endDate, status } = req.body;
    const sprint = await Sprint.findById(req.params.id);
    if (!sprint) return res.status(404).json({ message: "Sprint not found" });

    if (name) sprint.name = name;
    if (description !== undefined) sprint.description = description;
    if (startDate) sprint.startDate = startDate;
    if (endDate) sprint.endDate = endDate;
    if (status && ["planning", "active", "completed"].includes(status)) {
      sprint.status = status;
    }

    if (sprint.endDate <= sprint.startDate) {
      return res.status(400).json({ message: "End date must be after start date" });
    }

    await sprint.save();
    res.json({ sprint });
  } catch (err) {
    next(err);
  }
};

export const addBugToSprint = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid sprint ID" });
    }

    const { bugId } = req.body;
    if (!bugId || !mongoose.Types.ObjectId.isValid(bugId)) {
      return res.status(400).json({ message: "Valid bug ID is required" });
    }

    const sprint = await Sprint.findById(req.params.id);
    if (!sprint) return res.status(404).json({ message: "Sprint not found" });

    const bug = await Bug.findById(bugId);
    if (!bug) return res.status(404).json({ message: "Bug not found" });

    if (bug.project.toString() !== sprint.project.toString()) {
      return res.status(400).json({ message: "Bug must belong to the same project as the sprint" });
    }

    if (sprint.bugs.some((b) => b.toString() === bugId)) {
      return res.status(400).json({ message: "Bug is already in this sprint" });
    }

    sprint.bugs.push(bugId);
    await sprint.save();

    bug.sprint = sprint._id;
    await bug.save();

    res.json({ sprint });
  } catch (err) {
    next(err);
  }
};

export const removeBugFromSprint = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid sprint ID" });
    }

    const { bugId } = req.body;
    if (!bugId || !mongoose.Types.ObjectId.isValid(bugId)) {
      return res.status(400).json({ message: "Valid bug ID is required" });
    }

    const sprint = await Sprint.findById(req.params.id);
    if (!sprint) return res.status(404).json({ message: "Sprint not found" });

    sprint.bugs = sprint.bugs.filter((b) => b.toString() !== bugId);
    await sprint.save();

    const bug = await Bug.findById(bugId);
    if (bug && bug.sprint?.toString() === sprint._id.toString()) {
      bug.sprint = null;
      await bug.save();
    }

    res.json({ sprint });
  } catch (err) {
    next(err);
  }
};

export const deleteSprint = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid sprint ID" });
    }

    const sprint = await Sprint.findById(req.params.id);
    if (!sprint) return res.status(404).json({ message: "Sprint not found" });

    // Remove sprint reference from all bugs
    await Bug.updateMany({ sprint: sprint._id }, { sprint: null });
    await sprint.deleteOne();

    res.json({ message: "Sprint deleted" });
  } catch (err) {
    next(err);
  }
};
