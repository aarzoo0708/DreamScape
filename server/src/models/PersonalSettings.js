import mongoose from "mongoose";

const personalSettingsSchema = new mongoose.Schema(
  {
    _id: { type: String, default: "personal-settings" },
    displayName: { type: String, trim: true, maxlength: 80, default: "" },
    introduction: { type: String, trim: true, maxlength: 500, default: "" },
    favouriteQuote: { type: String, trim: true, maxlength: 500, default: "" },
    theme: { type: String, enum: ["midnight", "rose", "lavender"], default: "midnight" },
    customAlbums: {
      type: [{ type: String, trim: true, maxlength: 80 }],
      default: [],
      validate: [(albums) => albums.length <= 30, "You can save at most 30 custom albums."],
    },
    dashboardShowQuote: { type: Boolean, default: true },
    dashboardShowOnThisDay: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export default mongoose.model("PersonalSettings", personalSettingsSchema);
