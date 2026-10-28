import mongoose from "mongoose";

const memorySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "A memory title is required."],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    imageUrl: {
      type: String,
      trim: true,
    },
    imagePublicId: {
      type: String,
      trim: true,
    },
    date: {
      type: Date,
    },
    mood: {
      type: String,
      trim: true,
    },
    isFavourite: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

const Memory = mongoose.model("Memory", memorySchema);

export default Memory;
