import mongoose from "mongoose";

const bugSchema = new mongoose.Schema(
  {
    bugId: { type: String, required: true, unique: true }, // e.g. BUG-14
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    stepsToReproduce: { type: String, default: "" },
    expectedResult: { type: String, default: "" },
    actualResult: { type: String, default: "" },
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    status: {
      type: String,
      enum: ["open", "in_progress", "in_review", "resolved", "closed", "reopened"],
      default: "open",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    severity: {
      type: String,
      enum: ["minor", "major", "critical", "blocker"],
      default: "minor",
    },
    labels: [{ type: String, trim: true }],
    dueDate: { type: Date, default: null },
    sprint: { type: mongoose.Schema.Types.ObjectId, ref: "Sprint", default: null },
    watchers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    attachments: [
      {
        filename: String,
        originalName: String,
        mimetype: String,
        size: Number,
        url: String,
        uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    resolvedAt: { type: Date, default: null },
    closedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

bugSchema.index({ project: 1, status: 1 });
bugSchema.index({ assignedTo: 1 });
bugSchema.index({ watchers: 1 });
bugSchema.index({ sprint: 1 });
bugSchema.index({ title: "text", description: "text" });

export default mongoose.model("Bug", bugSchema);
