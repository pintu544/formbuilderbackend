import { Schema, model } from "mongoose";

const categorizeSchema = new Schema(
  {
    form: { type: Schema.Types.ObjectId, ref: "form" },
    type: { type: String, default: "categorize" },
    points: { type: Number, required: true },
    description: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    categories: [{ type: String }],
    itemsWithBelongsTo: [
      {
        item: { type: String },
        belongsTo: { type: String },
      },
    ],
  },
  { timestamps: true, versionKey: false }
);

export const categorizeModel = model("categorize", categorizeSchema);
