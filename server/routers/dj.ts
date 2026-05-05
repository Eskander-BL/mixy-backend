import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "../_core/trpc";
import {
  createGuestUser,
  getUserByGuestId,
  getUserById,
  saveOnboarding,
  createOrUpdateProgress,
  getProgress,
  saveQuizResult,
  markLevelCompleted,
  getCompletedLevels,
  saveTempQuizState,
  getTempQuizState,
  getSubscription,
  updateUserLanguage,
  resetUserProgress,
  updateUserLearningProfile,
} from "../db";
import { notifyOwner } from "../_core/notification";
// Mocked course content
const coursesContent: any[] = [];
for (let i = 1; i <= 10; i++) {
  coursesContent.push({
    level: i,
    title: `Level ${i}: Course Title`,
    slides: [
      {
        title: `Slide 1: Introduction`,
        content: `Content for level ${i}, slide 1`,
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      },
      {
        title: `Slide 2: Main Concept`,
        content: `Content for level ${i}, slide 2`,
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      },
      {
        title: `Slide 3: Practice`,
        content: `Content for level ${i}, slide 3`,
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      },
    ],
  });
}

/**
 * Indices des bonnes réponses — doivent matcher `QUIZ_DATA` dans QuizPage.tsx (niveaux 1–5).
 * Les niveaux 6–10 n’ont pas encore de quiz frontend ; clés factices pour submitQuiz si besoin.
 */
const FRONTEND_QUIZ_CORRECT_INDEX: Record<number, readonly number[]> = {
  1: [1, 1, 1, 1, 1],
  2: [1, 1, 1, 1, 1],
  3: [1, 2, 2, 1, 2],
  4: [1, 0, 1, 2, 2],
  5: [2, 0, 2, 1, 1],
};

function buildQuizQuestionsForLevel(level: number) {
  const correct = FRONTEND_QUIZ_CORRECT_INDEX[level];
  if (correct) {
    return correct.map((correctAnswerIndex, i) => ({
      question: `Quiz question ${level}-${i + 1}`,
      options: ["Option A", "Option B", "Option C", "Option D"],
      correctAnswerIndex,
    }));
  }
  return [1, 2, 3, 4, 5].map((q) => ({
    question: `Quiz question ${level}-${q}`,
    options: ["Option A", "Option B", "Option C", "Option D"],
    correctAnswerIndex: (q - 1) % 4,
  }));
}

const quizQuestionsData = Array.from({ length: 10 }, (_, idx) =>
  buildQuizQuestionsForLevel(idx + 1),
);

function parseLearningProfileFromUserJson(raw: string | null | undefined) {
  if (!raw) return null;
  try {
    const p = JSON.parse(raw) as Record<string, unknown>;
    if (!p || typeof p.equipment !== "string") return null;
    const equipment = p.equipment;
    if (
      equipment !== "none" &&
      equipment !== "controller" &&
      equipment !== "turntables" &&
      equipment !== "other"
    ) {
      return null;
    }
    const td = p.targetDeck;
    let targetDeck: string | null = null;
    if (td === null || td === undefined) targetDeck = null;
    else if (
      td === "flx4" ||
      td === "flx3" ||
      td === "xdj_rx" ||
      td === "other" ||
      td === "undecided"
    ) {
      targetDeck = td;
    } else {
      return null;
    }
    return {
      equipment,
      targetDeck,
      updatedAt: typeof p.updatedAt === "number" ? p.updatedAt : Date.now(),
    };
  } catch {
    return null;
  }
}

/**
 * DJ Academy router - handles all DJ learning features
 */
export const djRouter = router({
  /**
   * Initialize guest user on first visit
   */
  initGuest: publicProcedure.mutation(async () => {
    const user = await createGuestUser("Guest User");
    return {
      userId: user?.id,
      guestId: user?.guestId || "",
      language: user?.language || "en",
    };
  }),

  /**
   * Get or create user by guest ID
   */
  getOrCreateUser: publicProcedure
    .input(z.object({ guestId: z.string().optional() }))
    .query(async ({ input }) => {
      if (!input.guestId) {
        const user = await createGuestUser("Guest User");
        return {
          userId: user?.id,
          guestId: user?.guestId || "",
          status: "guest",
        };
      }

      const user = await getUserByGuestId(input.guestId);
      if (!user) {
        const newUser = await createGuestUser("Guest User");
        return {
          userId: newUser?.id,
          guestId: newUser?.guestId || "",
          status: "guest",
        };
      }

      return {
        userId: user.id,
        guestId: user.guestId,
        status: user.status,
      };
    }),

  /**
   * Save onboarding data
   */
  saveOnboarding: publicProcedure
    .input(
      z.object({
        userId: z.number(),
        level: z.enum(["beginner", "intermediate", "advanced"]),
        goal: z.enum(["fun", "party", "club", "pro"]),
        equipment: z.enum(["none", "controller", "turntables", "other"]),
        problem: z.enum(["transitions", "bpm", "structuration", "unknown"]),
        equipmentModel: z.string().max(255).optional(),
        quizScore: z.number().nullable().optional(),
        quizResult: z.enum(["beginner", "intermediate", "advanced"]).nullable().optional(),
      })
    )
    .mutation(async ({ input }) => {
      await saveOnboarding(input.userId, {
        level: input.level,
        goal: input.goal,
        equipment: input.equipment,
        problem: input.problem,
        equipmentModel: input.equipmentModel,
        quizScore: input.quizScore,
        quizResult: input.quizResult,
      });

      // Create or update progress
      await createOrUpdateProgress(input.userId);

      return { success: true };
    }),
  getUserProfile: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const user = await getUserById(input.userId);
      if (!user) return null;
      return {
        id: user.id,
        email: user.email,
        name: user.name,
      };
    }),

  resetProgress: publicProcedure
    .input(z.object({ userId: z.number(), level: z.number().min(1).default(1) }))
    .mutation(async ({ input }) => {
      await resetUserProgress(input.userId, input.level);
      return { success: true };
    }),

  contact: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        subject: z.enum(["Paiement", "Bug technique", "Question DJ", "Autre"]),
        message: z.string().min(10).max(5000),
      })
    )
    .mutation(async ({ input }) => {
      const sent = await notifyOwner({
        title: `[Mixy Contact] ${input.subject}`,
        content: `From: ${input.email}\n\n${input.message}`,
        replyTo: input.email,
      });
      return { success: sent };
    }),

  /**
   * Get user progress
   */
  getProgress: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const userProgress = await getProgress(input.userId);
      const completedLevelsRows = await getCompletedLevels(input.userId);
      const userRow = await getUserById(input.userId);
      const learningProfile = parseLearningProfileFromUserJson(userRow?.learningProfileJson ?? null);

      return {
        currentLevel: userProgress?.currentLevel || 1,
        lastCompletedLevel: userProgress?.lastCompletedLevel || 0,
        completedLevels: completedLevelsRows,
        learningProfile,
      };
    }),

  saveLearningProfile: publicProcedure
    .input(
      z.object({
        userId: z.number(),
        profile: z.object({
          equipment: z.enum(["none", "controller", "turntables", "other"]),
          targetDeck: z
            .enum(["flx4", "flx3", "xdj_rx", "other", "undecided"])
            .nullable()
            .optional(),
          updatedAt: z.number().optional(),
        }),
      }),
    )
    .mutation(async ({ input }) => {
      const payload = {
        equipment: input.profile.equipment,
        targetDeck: input.profile.targetDeck ?? null,
        updatedAt: input.profile.updatedAt ?? Date.now(),
      };
      await updateUserLearningProfile(input.userId, JSON.stringify(payload));
      return { success: true };
    }),

  /**
   * Get course content for a level
   */
  getCourse: publicProcedure
    .input(z.object({ level: z.number() }))
    .query(async ({ input }) => {
      // Return course from in-memory data
      const course = coursesContent[input.level - 1];
      if (!course) {
        throw new Error(`Course not found for level ${input.level}`);
      }

      return course;
    }),

  /**
   * Get quiz questions for a level
   */
  getQuizQuestions: publicProcedure
    .input(z.object({ level: z.number() }))
    .query(async ({ input }) => {
      const questions = quizQuestionsData[input.level - 1];
      if (!questions) {
        throw new Error(`Quiz not found for level ${input.level}`);
      }

      return questions;
    }),

  /**
   * Submit quiz answers and save result
   */
  submitQuiz: publicProcedure
    .input(
      z.object({
        userId: z.number(),
        level: z.number(),
        answers: z.array(z.number()),
      })
    )
    .mutation(async ({ input }) => {
      const questions = quizQuestionsData[input.level - 1];
      if (!questions) {
        throw new Error(`Quiz not found for level ${input.level}`);
      }

      // Calculate score
      let correctCount = 0;
      input.answers.forEach((answer, index) => {
        if (answer === questions[index].correctAnswerIndex) {
          correctCount++;
        }
      });

      const score = (correctCount / questions.length) * 100;
      const rounded = Math.round(score);

      // Save quiz result
      await saveQuizResult(input.userId, input.level, score);

      if (score >= 50) {
        await markLevelCompleted(input.userId, input.level);
      }

      // Save temp quiz state for paywall
      await saveTempQuizState(input.userId, input.level, score, {
        level: input.level,
        score: score,
      });

      return {
        score: rounded,
        correctCount,
        totalCount: questions.length,
      };
    }),

  /**
   * Complete a level (after payment)
   */
  completeLevel: publicProcedure
    .input(z.object({ userId: z.number(), level: z.number() }))
    .mutation(async () => {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Validation de niveau uniquement via quiz (serveur), pas via cette route.",
      });
    }),

  /**
   * Get temp quiz state (for paywall)
   */
  getTempQuizState: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const state = await getTempQuizState(input.userId);
      return state || null;
    }),

  /**
   * Create subscription (after payment)
   */
  createSubscription: publicProcedure
    .input(
      z.object({
        userId: z.number(),
        stripeCustomerId: z.string(),
        stripeSubscriptionId: z.string(),
      })
    )
    .mutation(async () => {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Abonnement activé uniquement via webhooks Stripe signés.",
      });
    }),

  /**
   * Get subscription status
   */
  getSubscription: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const subscription = await getSubscription(input.userId);
      return subscription || null;
    }),

  /**
   * Mini-quiz for level detection (mocked)
   */
  updateLanguage: publicProcedure
    .input(z.object({ userId: z.number(), language: z.enum(["en", "fr"]) }))
    .mutation(async ({ input }) => {
      await updateUserLanguage(input.userId, input.language);
      return { success: true };
    }),

  detectLevel: publicProcedure
    .input(z.object({ answers: z.array(z.number()) }))
    .mutation(async ({ input }) => {
      // Mock AI detection based on answers
      const correctCount = input.answers.filter((a) => a === 1).length;

      if (correctCount >= 4) {
        return { level: "advanced" };
      } else if (correctCount >= 2) {
        return { level: "intermediate" };
      } else {
        return { level: "beginner" };
      }
    }),
});
