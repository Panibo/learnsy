import type { Db } from "mongodb";
import { profiles, type ProfileData } from "../models/profile.js";
import type { LearnerContext } from "./types.js";

type LearnerFields = Pick<ProfileData, "name" | "role" | "organization" | "companyGoal" | "bio" | "goals" | "interests">;

/** Load only fields used on For you; never fetch or expose CV/contact data here. */
export async function loadLearner(db: Db, keyHash: string): Promise<LearnerContext | null> {
  const profile = await profiles(db).findOne<LearnerFields>({ _id: keyHash }, {
    projection: { _id: 0, name: 1, role: 1, organization: 1, companyGoal: 1, bio: 1, goals: 1, interests: 1 },
  });
  if (!profile) return null;
  return {
    name: profile.name,
    role: profile.role,
    organization: profile.organization,
    companyGoal: profile.companyGoal ?? "",
    goals: profile.goals,
    interests: profile.interests,
    knowledge: profile.bio,
  };
}
