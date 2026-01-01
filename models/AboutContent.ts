import mongoose, { Schema, type Model } from "mongoose";
import type { LocalizedText } from "@/types/localized";

type AboutContent = {
  title: LocalizedText;
  description: LocalizedText;
  image?: string;
  pdfLink?: string;
};

const LocalizedTextSchema = new Schema(
  {
    en: { type: String, required: true },
    fr: { type: String, required: true },
  },
  { _id: false }
);

const AboutContentSchema = new Schema<AboutContent>(
  {
    title: { type: LocalizedTextSchema, required: true },
    description: { type: LocalizedTextSchema, required: true },
    image: { type: String },
    pdfLink: { type: String },
  },
  { timestamps: true }
);

const AboutContentModel =
  (mongoose.models.AboutContent as Model<AboutContent>) ||
  mongoose.model<AboutContent>("AboutContent", AboutContentSchema);

export default AboutContentModel;
