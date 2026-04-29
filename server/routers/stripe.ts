import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "../_core/trpc";
import { getSubscription } from "../db";
import {
  createBillingPortalSession as stripeCreateBillingPortalSession,
  createCheckoutSession as createStripeSession,
  cancelSubscriptionAtPeriodEnd,
  retrieveStripeSubscription,
} from "../_core/stripe-client";

/**
 * Stripe payment router — validation paiement **uniquement** via webhooks Stripe.
 */
export const stripeRouter = router({
  /**
   * Create a Stripe Checkout session (vrai Stripe si clés présentes, sinon erreur explicite).
   */
  createCheckoutSession: publicProcedure
    .input(
      z.object({
        userId: z.number(),
        level: z.number(),
        successUrl: z.string(),
        cancelUrl: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const session = await createStripeSession({
          userId: input.userId,
          level: input.level,
          successUrl: input.successUrl,
          cancelUrl: input.cancelUrl,
        });
        if (!session.url) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Stripe a renvoyé une session sans URL de checkout",
          });
        }
        return {
          sessionId: session.id,
          checkoutUrl: session.url,
        };
      } catch (e) {
        if (e instanceof TRPCError) {
          throw e;
        }
        const message = e instanceof Error ? e.message : "Création de session échouée";
        console.error("[Stripe] createCheckoutSession failed:", e);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message,
        });
      }
    }),

  /**
   * Get subscription status
   */
  getSubscriptionStatus: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const subscription = await getSubscription(input.userId);
      const now = new Date();

      if (!subscription) {
        return {
          isActive: false,
          expiresAt: null,
          cancelAtPeriodEnd: false,
          stripeCustomerId: null,
          stripeSubscriptionId: null,
        };
      }

      const dbExpires = new Date(subscription.endDate);

      if (subscription.stripeSubscriptionId && process.env.STRIPE_SECRET_KEY) {
        try {
          const live = await retrieveStripeSubscription(subscription.stripeSubscriptionId);
          const periodEnd = live.currentPeriodEnd;
          const isLiveActive =
            (live.status === "active" || live.status === "trialing") && periodEnd > now;

          return {
            isActive: isLiveActive,
            expiresAt: periodEnd.toISOString(),
            cancelAtPeriodEnd: live.cancelAtPeriodEnd,
            stripeCustomerId: subscription.stripeCustomerId ?? null,
            stripeSubscriptionId: subscription.stripeSubscriptionId ?? null,
          };
        } catch (e) {
          console.warn("[Stripe] retrieve subscription fallback DB:", e);
        }
      }

      const isActive = subscription.status === "active" && dbExpires > now;

      return {
        isActive,
        expiresAt: dbExpires.toISOString(),
        cancelAtPeriodEnd: false,
        stripeCustomerId: subscription.stripeCustomerId ?? null,
        stripeSubscriptionId: subscription.stripeSubscriptionId ?? null,
      };
    }),

  /**
   * Désactive uniquement le renouvellement : accès maintenu jusqu'à current_period_end (Stripe).
   */
  cancelSubscription: publicProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input }) => {
      const subscription = await getSubscription(input.userId);
      if (!subscription?.stripeSubscriptionId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Aucun abonnement Stripe actif à annuler.",
        });
      }

      try {
        const result = await cancelSubscriptionAtPeriodEnd(subscription.stripeSubscriptionId);
        return {
          success: true,
          accessUntil: result.currentPeriodEnd.toISOString(),
          cancelAtPeriodEnd: result.cancelAtPeriodEnd,
        };
      } catch (e) {
        const message = e instanceof Error ? e.message : "Annulation impossible";
        console.error("[Stripe] cancelSubscription:", e);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message,
        });
      }
    }),

  /**
   * Portail Stripe (moyen de paiement, factures). À activer une fois dans le Dashboard Stripe.
   */
  createBillingPortalSession: publicProcedure
    .input(
      z.object({
        userId: z.number(),
        returnUrl: z.string().min(1),
      }),
    )
    .mutation(async ({ input }) => {
      const subscription = await getSubscription(input.userId);
      if (!subscription?.stripeCustomerId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Aucun client Stripe associé.",
        });
      }

      try {
        const { url } = await stripeCreateBillingPortalSession({
          stripeCustomerId: subscription.stripeCustomerId,
          returnUrl: input.returnUrl,
        });
        if (!url) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Portail Stripe sans URL",
          });
        }
        return { url };
      } catch (e) {
        if (e instanceof TRPCError) throw e;
        const message = e instanceof Error ? e.message : "Portail indisponible";
        console.error("[Stripe] billing portal:", e);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message,
        });
      }
    }),
});
