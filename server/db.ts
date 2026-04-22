import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  InsertUser,
  users,
  onboarding,
  progress,
  quizResults,
  subscriptions,
  courses,
  quizQuestions,
  tempQuizState,
  completedLevels,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;
let _client: postgres.Sql | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _client = postgres(process.env.DATABASE_URL);
      _db = drizzle(_client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
      _client = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId && !user.guestId) {
    throw new Error("User openId or guestId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
      guestId: user.guestId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    // PostgreSQL: use onConflict instead of onDuplicateKeyUpdate
    const conflictTarget = user.openId ? users.openId : users.guestId;
    await db.insert(users).values(values).onConflictDoUpdate({
      target: conflictTarget,
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByGuestId(guestId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.guestId, guestId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function createGuestUser(name: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create guest user: database not available");
    return undefined;
  }

  const guestId = `guest_${nanoid()}`;
  
  try {
    await db.insert(users).values({
      guestId,
      name,
      status: "guest",
      role: "user",
    });

    return { id: guestId, guestId, name, status: "guest" };
  } catch (error) {
    console.error("[Database] Failed to create guest user:", error);
    throw error;
  }
}

export async function saveOnboarding(userId: number, data: any) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot save onboarding: database not available");
    return;
  }

  try {
    await db.insert(onboarding).values({
      userId,
      level: data.level || "beginner",
      goal: data.goal || "fun",
      equipment: data.equipment || "none",
      problem: data.problem || "unknown",
    });
  } catch (error) {
    console.error("[Database] Failed to save onboarding:", error);
    throw error;
  }
}

export async function getProgress(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get progress: database not available");
    return undefined;
  }

  const result = await db.select().from(progress).where(eq(progress.userId, userId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function createOrUpdateProgress(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create progress: database not available");
    return;
  }

  try {
    const existing = await getProgress(userId);
    
    if (existing) {
      await db.update(progress).set({
        updatedAt: new Date(),
      }).where(eq(progress.userId, userId));
    } else {
      await db.insert(progress).values({
        userId,
        currentLevel: 1,
        lastCompletedLevel: 0,
      });
    }
  } catch (error) {
    console.error("[Database] Failed to create/update progress:", error);
    throw error;
  }
}

export async function saveQuizResult(userId: number, level: number, score: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot save quiz result: database not available");
    return;
  }

  try {
    await db.insert(quizResults).values({
      userId,
      level,
      score: score.toString(),
    });
  } catch (error) {
    console.error("[Database] Failed to save quiz result:", error);
    throw error;
  }
}

export async function markLevelCompleted(userId: number, level: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot mark level completed: database not available");
    return;
  }

  try {
    // Check if already completed
    const existing = await db.select().from(completedLevels)
      .where(and(eq(completedLevels.userId, userId), eq(completedLevels.level, level)))
      .limit(1);

    if (!existing || existing.length === 0) {
      await db.insert(completedLevels).values({
        userId,
        level,
      });
    }
  } catch (error) {
    console.error("[Database] Failed to mark level completed:", error);
    throw error;
  }
}

export async function getCompletedLevels(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get completed levels: database not available");
    return [];
  }

  try {
    const results = await db.select().from(completedLevels)
      .where(eq(completedLevels.userId, userId));

    return results.map(r => r.level);
  } catch (error) {
    console.error("[Database] Failed to get completed levels:", error);
    return [];
  }
}

export async function saveTempQuizState(userId: number, level: number, score: number, onboardingData: any) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot save temp quiz state: database not available");
    return;
  }

  try {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await db.insert(tempQuizState).values({
      userId,
      level,
      score: score.toString(),
      onboardingData: JSON.stringify(onboardingData),
      expiresAt,
    }).onConflictDoUpdate({
      target: tempQuizState.userId,
      set: {
        level,
        score: score.toString(),
        onboardingData: JSON.stringify(onboardingData),
        expiresAt,
      },
    });
  } catch (error) {
    console.error("[Database] Failed to save temp quiz state:", error);
    throw error;
  }
}

export async function getTempQuizState(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get temp quiz state: database not available");
    return undefined;
  }

  try {
    const result = await db.select().from(tempQuizState)
      .where(eq(tempQuizState.userId, userId))
      .limit(1);

    return result.length > 0 ? result[0] : undefined;
  } catch (error) {
    console.error("[Database] Failed to get temp quiz state:", error);
    return undefined;
  }
}

export async function createSubscription(userId: number, stripeCustomerId: string, stripeSubscriptionId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create subscription: database not available");
    return;
  }

  try {
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await db.insert(subscriptions).values({
      userId,
      stripeCustomerId,
      stripeSubscriptionId,
      startDate,
      endDate,
      status: "active",
    });

    // Update user subscription status
    await db.update(users).set({
      subscriptionActive: true,
      subscriptionExpiresAt: endDate,
    }).where(eq(users.id, userId));
  } catch (error) {
    console.error("[Database] Failed to create subscription:", error);
    throw error;
  }
}

export async function updateUserLanguage(userId: number, language: "en" | "fr") {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update user language: database not available");
    return;
  }

  try {
    await db.update(users).set({
      language: language,
      updatedAt: new Date(),
    }).where(eq(users.id, userId));
  } catch (error) {
    console.error("[Database] Failed to update user language:", error);
    throw error;
  }
}

export async function getSubscription(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get subscription: database not available");
    return undefined;
  }

  try {
    const result = await db.select().from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);

    return result.length > 0 ? result[0] : undefined;
  } catch (error) {
    console.error("[Database] Failed to get subscription:", error);
    return undefined;
  }
}

// TODO: add feature queries here as your schema grows.
