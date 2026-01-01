import mongoose from "mongoose";

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const MONGODB_URI = process.env.MONGODB_URI;

const globalWithMongoose = global as typeof globalThis & {
  mongoose: MongooseCache;
};

const cached = globalWithMongoose.mongoose || { conn: null, promise: null };
globalWithMongoose.mongoose = cached;

export async function connectToDatabase() {
  if (!MONGODB_URI) {
    throw new Error("Please define the MONGODB_URI environment variable");
  }
  if (cached.conn) {
    return cached.conn;
  }
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI as string, {
      bufferCommands: false,
    });
  }
  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    console.error("MongoDB connection failed", error);
    throw error;
  }
  return cached.conn;
}
