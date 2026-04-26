import { COOKIE_NAME, COOKIE_NAME_LOCAL } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { clearLocalSessionCookie, setLocalSessionCookie } from "./_core/localAuth";
import { hashPassword, verifyPassword } from "./_core/password";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { djRouter } from "./routers/dj";
import { aiRouter } from "./routers/ai";
import { stripeRouter } from "./routers/stripe";
import * as db from "./db";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  dj: djRouter,
  ai: aiRouter,
  stripe: stripeRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),

    /**
     * Inscription email + mdp sur la **même** ligne `users` (guest) — abonnement inchangé (même `userId`).
     * Prouve l’identité avec le couple (userId, guestId) issu du `localStorage`.
     */
    completeGuestRegistration: publicProcedure
      .input(
        z.object({
          userId: z.number().int().positive(),
          guestId: z.string().min(1),
          email: z.string().email(),
          password: z.string().min(8).max(200),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const u = await db.getUserById(input.userId);
        if (!u || !u.guestId) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Invité introuvable" });
        }
        if (u.guestId !== input.guestId) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Identifiant invité incorrect" });
        }
        if (u.email) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Compte déjà enregistré" });
        }
        if (u.openId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Compte lié à une autre connexion. Utilise la connexion sociale.",
          });
        }
        if (await db.isEmailTakenByOther(input.email, u.id)) {
          throw new TRPCError({ code: "CONFLICT", message: "Cet email est déjà utilisé" });
        }
        const passwordHash = await hashPassword(input.password);
        await db.updateGuestToEmailAccount(u.id, { email: input.email, passwordHash });
        await setLocalSessionCookie(ctx.req, ctx.res, u.id);
        return {
          success: true as const,
          userId: u.id,
          email: input.email.trim().toLowerCase(),
        };
      }),

    /**
     * Connexion email + mot de passe (même compte côté serveur, cookie local).
     */
    loginWithEmail: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          password: z.string().min(1).max(200),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const u = await db.getUserByEmail(input.email);
        if (!u?.passwordHash) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Email ou mot de passe incorrect",
          });
        }
        const ok = await verifyPassword(input.password, u.passwordHash);
        if (!ok) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Email ou mot de passe incorrect",
          });
        }
        await db.touchUserSignedIn(u.id);
        await setLocalSessionCookie(ctx.req, ctx.res, u.id);
        return {
          success: true as const,
          userId: u.id,
          email: u.email,
          name: u.name,
        };
      }),

    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      clearLocalSessionCookie(ctx.req, ctx.res);
      return {
        success: true,
      } as const;
    }),
  }),

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
