import mongoose from "mongoose";

const sprintSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    description: { type: String, default: "" },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["planning", "active", "completed"],
      default: "planning",
    },
    bugs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Bug" }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

sprintSchema.index({ project: 1, status: 1 });

export default mongoose.model("Sprint", sprintSchema);
