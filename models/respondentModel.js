import { Schema, model } from "mongoose";

const respondentSchema = new Schema(
  {
    form: { type: Schema.Types.ObjectId, ref: "form", required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    points: { type: Number, required: true },
    answers: [{ type: Object }],
  },
  { timestamps: true, versionKey: false }
);

export const respondentModel = model("respondent", respondentSchema);
