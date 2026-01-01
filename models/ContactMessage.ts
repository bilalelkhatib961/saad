import mongoose, { Schema, type Model } from "mongoose";

type ContactMessage = {
  name: string;
  email: string;
  message: string;
  createdAt?: Date;
};

const ContactMessageSchema = new Schema<ContactMessage>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    message: { type: String, required: true },
  },
  { timestamps: true }
);

const ContactMessageModel =
  (mongoose.models.ContactMessage as Model<ContactMessage>) ||
  mongoose.model<ContactMessage>("ContactMessage", ContactMessageSchema);

export default ContactMessageModel;
