import type { LocalizedText } from "@/types/localized";

export type GalleryItem = {
  _id?: string;
  id?: string;
  title: LocalizedText;
  description: LocalizedText;
  fullDescription: LocalizedText;
  mainImage: string;
  additionalImages: string[];
  videos?: string[];
  order?: number;
  createdAt?: string;
  updatedAt?: string;
};
