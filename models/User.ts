import mongoose, { Schema, type Model } from "mongoose";
import type { User } from "@/types/user";

const UserSchema = new Schema<User>(
  {
    username: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
);

const UserModel =
  (mongoose.models.User as Model<User>) ||
  mongoose.model<User>("User", UserSchema);

export default UserModel;
