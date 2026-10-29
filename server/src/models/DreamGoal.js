import mongoose from "mongoose";

const dreamGoalSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 140 },
    description: { type: String, trim: true, maxlength: 4000 },
    progress: { type: Number, min: 0, max: 100, default: 0 },
    completed: { type: Boolean, default: false },
    archived: { type: Boolean, default: false },
    targetDate: { type: Date, default: null },
  },
  { timestamps: true },
);

dreamGoalSchema.index({ archived: 1, completed: 1, updatedAt: -1 });

export default mongoose.model("DreamGoal", dreamGoalSchema);
