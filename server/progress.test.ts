import { describe, it, expect, beforeEach } from "vitest";

interface UserProgress {
  currentLevel: number;
  completedLevels: number[];
  scores: Record<number, number>;
}

// Simuler les fonctions de progression
function isLevelUnlocked(level: number, progress: UserProgress): boolean {
  if (level === 1) return true;
  return progress.completedLevels.includes(level - 1);
}

function isLevelCompleted(level: number, progress: UserProgress): boolean {
  return progress.completedLevels.includes(level);
}

function completeLevel(
  level: number,
  score: number,
  progress: UserProgress
): UserProgress {
  const updated = { ...progress };
  if (!updated.completedLevels.includes(level)) {
    updated.completedLevels.push(level);
  }
  updated.scores[level] = score;
  updated.currentLevel = level + 1;
  return updated;
}

describe("DJ Academy - Progress Logic", () => {
  let progress: UserProgress;

  beforeEach(() => {
    progress = {
      currentLevel: 1,
      completedLevels: [],
      scores: {},
    };
  });

  describe("Level Unlocking", () => {
    it("Level 1 should always be unlocked", () => {
      expect(isLevelUnlocked(1, progress)).toBe(true);
    });

    it("Level 2 should be locked initially", () => {
      expect(isLevelUnlocked(2, progress)).toBe(false);
    });

    it("Level 2 should be unlocked after completing Level 1", () => {
      progress = completeLevel(1, 75, progress);
      expect(isLevelUnlocked(2, progress)).toBe(true);
    });

    it("Level 3 should be locked until Level 2 is completed", () => {
      progress = completeLevel(1, 75, progress);
      expect(isLevelUnlocked(3, progress)).toBe(false);

      progress = completeLevel(2, 80, progress);
      expect(isLevelUnlocked(3, progress)).toBe(true);
    });
  });

  describe("Level Completion", () => {
    it("Level should not be completed initially", () => {
      expect(isLevelCompleted(1, progress)).toBe(false);
    });

    it("Level should be completed after completeLevel", () => {
      progress = completeLevel(1, 85, progress);
      expect(isLevelCompleted(1, progress)).toBe(true);
    });

    it("Score should be saved correctly", () => {
      progress = completeLevel(1, 92, progress);
      expect(progress.scores[1]).toBe(92);
    });
  });

  describe("Sequential Progression", () => {
    it("User should progress through levels sequentially", () => {
      // Level 1
      expect(isLevelUnlocked(1, progress)).toBe(true);
      progress = completeLevel(1, 88, progress);
      expect(isLevelCompleted(1, progress)).toBe(true);

      // Level 2
      expect(isLevelUnlocked(2, progress)).toBe(true);
      progress = completeLevel(2, 76, progress);
      expect(isLevelCompleted(2, progress)).toBe(true);

      // Level 3
      expect(isLevelUnlocked(3, progress)).toBe(true);
      progress = completeLevel(3, 81, progress);
      expect(isLevelCompleted(3, progress)).toBe(true);

      // Level 4
      expect(isLevelUnlocked(4, progress)).toBe(true);
    });

    it("currentLevel should update after each completion", () => {
      expect(progress.currentLevel).toBe(1);

      progress = completeLevel(1, 75, progress);
      expect(progress.currentLevel).toBe(2);

      progress = completeLevel(2, 80, progress);
      expect(progress.currentLevel).toBe(3);
    });
  });

  describe("Score Independence", () => {
    it("Level should unlock regardless of score", () => {
      // Low score
      progress = completeLevel(1, 45, progress);
      expect(isLevelUnlocked(2, progress)).toBe(true);

      // Reset
      progress = {
        currentLevel: 1,
        completedLevels: [],
        scores: {},
      };

      // High score
      progress = completeLevel(1, 95, progress);
      expect(isLevelUnlocked(2, progress)).toBe(true);
    });

    it("Different scores should not affect unlock logic", () => {
      const scores = [30, 50, 70, 85, 100];

      for (const score of scores) {
        const testProgress = {
          currentLevel: 1,
          completedLevels: [],
          scores: {},
        };

        const updated = completeLevel(1, score, testProgress);
        expect(isLevelUnlocked(2, updated)).toBe(true);
      }
    });
  });

  describe("Multiple Levels", () => {
    it("Should handle completion of all 10 levels", () => {
      for (let i = 1; i <= 10; i++) {
        expect(isLevelUnlocked(i, progress)).toBe(true);
        progress = completeLevel(i, 70 + i, progress);
        expect(isLevelCompleted(i, progress)).toBe(true);
      }

      expect(progress.completedLevels.length).toBe(10);
      expect(progress.currentLevel).toBe(11);
    });

    it("Progress bar should reflect completion", () => {
      const getProgressPercentage = (p: UserProgress) =>
        (p.completedLevels.length / 10) * 100;

      expect(getProgressPercentage(progress)).toBe(0);

      progress = completeLevel(1, 75, progress);
      expect(getProgressPercentage(progress)).toBe(10);

      progress = completeLevel(2, 80, progress);
      expect(getProgressPercentage(progress)).toBe(20);

      progress = completeLevel(3, 85, progress);
      expect(getProgressPercentage(progress)).toBe(30);
    });
  });

  describe("Paywall Logic", () => {
    it("Should add level to completedLevels after payment", () => {
      // Before payment
      expect(progress.completedLevels.includes(1)).toBe(false);

      // After payment (simulated)
      progress = completeLevel(1, 75, progress);

      // After payment
      expect(progress.completedLevels.includes(1)).toBe(true);
      expect(isLevelUnlocked(2, progress)).toBe(true);
    });

    it("Should not duplicate completed levels", () => {
      progress = completeLevel(1, 75, progress);
      expect(progress.completedLevels.length).toBe(1);

      // Try to complete again
      progress = completeLevel(1, 80, progress);
      expect(progress.completedLevels.length).toBe(1);
    });
  });
});
