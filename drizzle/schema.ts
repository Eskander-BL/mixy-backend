import {
  integer,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  pgTable,
  pgEnum,
} from "drizzle-orm/pg-core";

/**
 * Enums for PostgreSQL
 */
export const userStatus = pgEnum("user_status", ["guest", "registered", "active", "inactive"]);
export const userLanguage = pgEnum("user_language", ["en", "fr"]);
export const userRole = pgEnum("user_role", ["user", "admin"]);
export const userLevel = pgEnum("user_level", ["beginner", "intermediate", "advanced"]);
export const userGoal = pgEnum("user_goal", ["fun", "party", "club", "pro"]);
export const userEquipment = pgEnum("user_equipment", ["none", "controller", "turntables", "other"]);
export const userProblem = pgEnum("user_problem", ["transitions", "bpm", "structuration", "unknown"]);
export const subscriptionStatus = pgEnum("subscription_status", ["active", "expired", "cancelled"]);

/**
 * Core user table backing auth flow.
 * Supports guest, registered, and paid users.
 */
export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  guestId: varchar("guest_id", { length: 64 }).unique(),
  openId: varchar("openId", { length: 64 }).unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(),
  passwordHash: text("password_hash"),
  loginMethod: varchar("loginMethod", { length: 64 }),
  status: userStatus("status").default("guest").notNull(),
  role: userRole("role").default("user").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastSignedIn: timestamp("last_signed_in").defaultNow().notNull(),
  language: userLanguage("language").default("en").notNull(),
  subscriptionActive: boolean("subscription_active").default(false).notNull(),
  subscriptionExpiresAt: timestamp("subscription_expires_at"),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Completed levels for each user.
 * Tracks which levels the user has completed (independent of subscription).
 */
export const completedLevels = pgTable("completed_levels", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull(),
  level: integer("level").notNull(),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
});

export type CompletedLevel = typeof completedLevels.$inferSelect;
export type InsertCompletedLevel = typeof completedLevels.$inferInsert;

/**
 * Onboarding data for each user.
 * Stores: level, goal, equipment, problem.
 */
export const onboarding = pgTable("onboarding", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull(),
  level: userLevel("level").default("beginner").notNull(),
  goal: userGoal("goal").notNull(),
  equipment: userEquipment("equipment").default("none").notNull(),
  problem: userProblem("problem").notNull(),
  equipmentModel: varchar("equipment_model", { length: 255 }),
  quizScore: decimal("quiz_score", { precision: 5, scale: 2 }),
  quizResult: userLevel("quiz_result"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Onboarding = typeof onboarding.$inferSelect;
export type InsertOnboarding = typeof onboarding.$inferInsert;

/**
 * User progress tracking.
 * Tracks current level and last completed level.
 */
export const progress = pgTable("progress", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull().unique(),
  currentLevel: integer("current_level").default(1).notNull(),
  lastCompletedLevel: integer("last_completed_level").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Progress = typeof progress.$inferSelect;
export type InsertProgress = typeof progress.$inferInsert;

/**
 * Quiz results for each user and level.
 * Stores score and timestamp.
 */
export const quizResults = pgTable("quiz_results", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull(),
  level: integer("level").notNull(),
  score: decimal("score", { precision: 5, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type QuizResult = typeof quizResults.$inferSelect;
export type InsertQuizResult = typeof quizResults.$inferInsert;

/**
 * Subscription data for paid users.
 * Tracks subscription dates and status.
 */
export const subscriptions = pgTable("subscriptions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull().unique(),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: subscriptionStatus("status").default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

/**
 * Course content for each level (1-10).
 * Stores: title, content, video URL, exercise.
 */
export const courses = pgTable("courses", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  level: integer("level").notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  videoUrl: text("video_url").notNull(),
  exercise: text("exercise").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Course = typeof courses.$inferSelect;
export type InsertCourse = typeof courses.$inferInsert;

/**
 * Course slides for each course.
 * Stores: courseId, slideNumber, title, content, videoUrl, exercise.
 */
export const courseSlides = pgTable("course_slides", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  courseId: integer("course_id").notNull(),
  slideNumber: integer("slide_number").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  videoUrl: text("video_url"),
  exercise: text("exercise"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type CourseSlide = typeof courseSlides.$inferSelect;
export type InsertCourseSlide = typeof courseSlides.$inferInsert;

/**
 * Quiz questions for each level.
 * Stores: level, questions, answers, correct answer index.
 */
export const quizQuestions = pgTable("quiz_questions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  level: integer("level").notNull(),
  questionNumber: integer("question_number").notNull(),
  question: text("question").notNull(),
  options: text("options").notNull(), // JSON array of options
  correctAnswerIndex: integer("correct_answer_index").notNull(),
  explanation: text("explanation"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type QuizQuestion = typeof quizQuestions.$inferSelect;
export type InsertQuizQuestion = typeof quizQuestions.$inferInsert;

/**
 * Temporary quiz state before payment.
 * Stores: score, level, onboarding data.
 */
export const tempQuizState = pgTable("temp_quiz_state", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull().unique(),
  score: decimal("score", { precision: 5, scale: 2 }).notNull(),
  level: integer("level").notNull(),
  onboardingData: text("onboarding_data"), // JSON
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

export type TempQuizState = typeof tempQuizState.$inferSelect;
export type InsertTempQuizState = typeof tempQuizState.$inferInsert;
