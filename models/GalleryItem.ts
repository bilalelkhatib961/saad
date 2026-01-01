import mongoose, { Schema, type Model } from "mongoose";
import type { GalleryItem } from "@/types/gallery-item";

const LocalizedTextSchema = new Schema(
  {
    en: { type: String, required: true },
    fr: { type: String, required: true },
  },
  { _id: false }
);

const GalleryItemSchema = new Schema<GalleryItem>(
  {
    title: { type: LocalizedTextSchema, required: true },
    description: { type: LocalizedTextSchema, required: true },
    fullDescription: { type: LocalizedTextSchema, required: true },
    mainImage: { type: String, required: true },
    additionalImages: { type: [String], default: [] },
    videos: { type: [String], default: [] },
  },
  { timestamps: true }
);

const GalleryItemModel =
  (mongoose.models.GalleryItem as Model<GalleryItem>) ||
  mongoose.model<GalleryItem>("GalleryItem", GalleryItemSchema);

export default GalleryItemModel;
