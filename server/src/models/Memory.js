import mongoose from "mongoose";

const photoSchema = new mongoose.Schema(
  {
    imageUrl: { type: String, required: true, trim: true },
    imagePublicId: { type: String, trim: true, default: "" },
    caption: { type: String, trim: true, maxlength: 240 },
  },
  { _id: false },
);

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
    album: {
      type: String,
      trim: true,
      default: "Everyday Moments",
      maxlength: 80,
    },
    location: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    tags: {
      type: [{ type: String, trim: true, maxlength: 40 }],
      default: [],
      validate: [(tags) => tags.length <= 20, "A memory can have at most 20 tags."],
    },
    photos: {
      type: [photoSchema],
      default: [],
      validate: [(photos) => photos.length <= 12, "A memory can have at most 12 photos."],
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
