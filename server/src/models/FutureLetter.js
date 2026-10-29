import mongoose from "mongoose";

const futureLetterSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    content: { type: String, required: true, trim: true, maxlength: 30000 },
    unlockAt: { type: Date, default: null },
  },
  { timestamps: true },
);

futureLetterSchema.index({ unlockAt: 1, createdAt: -1 });

export default mongoose.model("FutureLetter", futureLetterSchema);
