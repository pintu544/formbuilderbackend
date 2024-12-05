import { Schema, model } from "mongoose";

const formSchema = new Schema(
  {
    formName: { type: String, required: true },
    headerImage: { type: String, default: "" },
  },
  { timestamps: true, versionKey: false }
);

export const formModel = model("form", formSchema);
