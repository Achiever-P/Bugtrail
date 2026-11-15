import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: [
        "bug_assigned",
        "bug_reassigned",
        "bug_status_changed",
        "bug_commented",
        "bug_due_soon",
        "project_member_added",
        "project_member_removed",
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, default: "" },
    bug: { type: mongoose.Schema.Types.ObjectId, ref: "Bug", default: null },
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", default: null },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

export default mongoose.model("Notification", notificationSchema);
