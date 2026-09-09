import { MongoClient } from "mongodb";

let client: MongoClient | undefined;

export async function connectDatabase() {
  const uri = process.env.DB_URL;
  if (!uri) throw new Error("DB_URL is required");
  client ??= new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
  await client.connect();
  return client.db(process.env.MONGODB_DB ?? "aisprint");
}

export async function disconnectDatabase() {
  await client?.close();
  client = undefined;
}
