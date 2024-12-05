import { Schema, model } from "mongoose";

const comprehensionSchema = new Schema(
  {
    form: { type: Schema.Types.ObjectId, ref: "form" },
    type: { type: String, default: "comprehension" },
    points: { type: Number, required: true },
    passage: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    mcqs: [
      {
        question: { type: String },
        options: [{ type: String }],
        answer: { type: Number },
      },
    ],
  },
  { timestamps: true, versionKey: false }
);

export const comprehensionModel = model("comprehension", comprehensionSchema);
