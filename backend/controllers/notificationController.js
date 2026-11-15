import mongoose from "mongoose";
import Notification from "../models/Notification.js";

export const getNotifications = async (req, res, next) => {
  try {
    const { unread } = req.query;
    const filter = { recipient: req.user._id };
    if (unread === "true") filter.isRead = false;

    const notifications = await Notification.find(filter)
      .populate("actor", "name avatarInitials")
      .populate("bug", "bugId title")
      .populate("project", "name key")
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
    });

    res.json({ notifications, unreadCount });
  } catch (err) {
    next(err);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid notification ID" });
    }

    const notification = await Notification.findOne({
      _id: id,
      recipient: req.user._id,
    });
    if (!notification) return res.status(404).json({ message: "Notification not found" });

    notification.isRead = true;
    await notification.save();
    res.json({ notification });
  } catch (err) {
    next(err);
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true }
    );
    res.json({ message: "All notifications marked as read" });
  } catch (err) {
    next(err);
  }
};

export const getUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
    });
    res.json({ count });
  } catch (err) {
    next(err);
  }
};
