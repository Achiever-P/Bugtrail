import mongoose from "mongoose";
import Comment from "../models/Comment.js";
import Bug from "../models/Bug.js";
import ActivityLog from "../models/ActivityLog.js";
import Notification from "../models/Notification.js";

export const addComment = async (req, res, next) => {
  try {
    const { text } = req.body;
    const { bugId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(bugId)) {
      return res.status(400).json({ message: "Invalid bug ID" });
    }

    const bug = await Bug.findById(bugId);
    if (!bug) return res.status(404).json({ message: "Bug not found" });
    if (!text || !text.trim()) return res.status(400).json({ message: "Comment text is required" });

    const comment = await Comment.create({
      bug: bug._id,
      author: req.user._id,
      text: text.trim(),
    });

    await ActivityLog.create({
      bug: bug._id,
      actor: req.user._id,
      action: "commented",
      meta: text.trim().slice(0, 80),
    });

    // Notify watchers, reporter, and assignee
    const recipients = [...(bug.watchers || [])];
    if (bug.reportedBy) recipients.push(bug.reportedBy);
    if (bug.assignedTo) recipients.push(bug.assignedTo);

    try {
      const uniqueRecipients = [...new Set(recipients.map((r) => r.toString()))].filter(
        (r) => r !== req.user._id.toString()
      );
      if (uniqueRecipients.length > 0) {
        await Notification.insertMany(
          uniqueRecipients.map((r) => ({
            recipient: r,
            type: "bug_commented",
            title: "New comment",
            message: `${req.user.name} commented on ${bug.bugId}: ${text.trim().slice(0, 60)}`,
            bug: bug._id,
            project: bug.project,
            actor: req.user._id,
          }))
        );
      }
    } catch (e) { /* notification failure should not break the operation */ }

    const populated = await comment.populate("author", "name role avatarInitials");
    res.status(201).json({ comment: populated });
  } catch (err) {
    next(err);
  }
};

export const getComments = async (req, res, next) => {
  try {
    const { bugId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(bugId)) {
      return res.status(400).json({ message: "Invalid bug ID" });
    }

    const comments = await Comment.find({ bug: bugId })
      .populate("author", "name role avatarInitials")
      .sort({ createdAt: 1 });
    res.json({ comments });
  } catch (err) {
    next(err);
  }
};

export const updateComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid comment ID" });
    }

    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    const comment = await Comment.findById(id);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    // Only author can edit their own comment
    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to edit this comment" });
    }

    comment.text = text.trim();
    await comment.save();

    const populated = await comment.populate("author", "name role avatarInitials");
    res.json({ comment: populated });
  } catch (err) {
    next(err);
  }
};

export const deleteComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid comment ID" });
    }

    const comment = await Comment.findById(id);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    if (comment.author.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to delete this comment" });
    }

    await comment.deleteOne();
    res.json({ message: "Comment deleted" });
  } catch (err) {
    next(err);
  }
};
