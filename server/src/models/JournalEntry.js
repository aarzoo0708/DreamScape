import mongoose from "mongoose";

const journalEntrySchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    content: { type: String, required: true, trim: true, maxlength: 20000 },
    mood: { type: String, trim: true, maxlength: 60 },
  },
  { timestamps: true },
);

journalEntrySchema.index({ date: -1, createdAt: -1 });

export default mongoose.model("JournalEntry", journalEntrySchema);
