import { Schema, model } from "mongoose";

const clozeSchema = new Schema(
  {
    form: { type: Schema.Types.ObjectId, ref: "form" },
    type: { type: String, default: "cloze" },
    points: { type: Number, required: true },
    sentence: { type: String, default: "" },
    sentenceWithBlanks: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    options: [{ type: String }],
  },
  { timestamps: true, versionKey: false }
);

export const clozeModel = model("cloze", clozeSchema);
