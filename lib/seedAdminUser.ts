import bcrypt from "bcryptjs";
import UserModel from "@/models/User";

const DEFAULT_ADMIN_USERNAME = "saad";
const DEFAULT_ADMIN_PASSWORD = "P@ssw0rd";

export async function ensureAdminUser() {
  const existing = await UserModel.findOne({
    username: DEFAULT_ADMIN_USERNAME,
  }).lean();

  if (existing) {
    return existing;
  }

  const passwordHash = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 12);
  const created = await UserModel.create({
    username: DEFAULT_ADMIN_USERNAME,
    passwordHash,
  });

  return created;
}
