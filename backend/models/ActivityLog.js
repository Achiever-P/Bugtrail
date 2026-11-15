import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
  {
    bug: { type: mongoose.Schema.Types.ObjectId, ref: "Bug", required: true },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    action: {
      type: String,
      enum: [
        "created",
        "status_changed",
        "assigned",
        "unassigned",
        "priority_changed",
        "severity_changed",
        "commented",
        "reopened",
        "closed",
        "updated",
      ],
      required: true,
    },
    fromValue: { type: String, default: null },
    toValue: { type: String, default: null },
    meta: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("ActivityLog", activityLogSchema);
