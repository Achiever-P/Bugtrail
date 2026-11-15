import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    key: { type: String, required: true, unique: true, uppercase: true, trim: true }, // e.g. "BUG", "APP"
    description: { type: String, default: "" },
    lead: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    isArchived: { type: Boolean, default: false },
    bugSequence: { type: Number, default: 0 }, // used to generate BUG-1, BUG-2, ...
  },
  { timestamps: true }
);

export default mongoose.model("Project", projectSchema);
