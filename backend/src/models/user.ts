import type { Db, ObjectId } from "mongodb";

export interface User {
  _id?: ObjectId;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export const userSchema = {
  bsonType: "object",
  required: ["name", "email", "createdAt", "updatedAt"],
  additionalProperties: false,
  properties: {
    _id: { bsonType: "objectId" },
    name: { bsonType: "string", minLength: 1 },
    email: { bsonType: "string", pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$" },
    createdAt: { bsonType: "date" },
    updatedAt: { bsonType: "date" },
  },
};

export async function initializeUsers(db: Db) {
  const users = await db.createCollection<User>("users", {
    validator: { $jsonSchema: userSchema },
  });
  await users.createIndex({ email: 1 }, { unique: true });
  return users;
}

export async function createUser(db: Db, input: Pick<User, "name" | "email">) {
  const now = new Date();
  const user: User = {
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    createdAt: now,
    updatedAt: now,
  };
  const result = await db.collection<User>("users").insertOne(user);
  return { ...user, _id: result.insertedId };
}
