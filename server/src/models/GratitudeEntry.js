import mongoose from "mongoose";

const gratitudeEntrySchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    kind: { type: String, enum: ["gratitude", "win"], default: "gratitude" },
    title: { type: String, trim: true, maxlength: 120 },
    content: { type: String, required: true, trim: true, maxlength: 5000 },
  },
  { timestamps: true },
);

gratitudeEntrySchema.index({ date: -1, createdAt: -1 });

export default mongoose.model("GratitudeEntry", gratitudeEntrySchema);
